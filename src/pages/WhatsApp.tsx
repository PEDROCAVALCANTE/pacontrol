import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Wifi, WifiOff, QrCode, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/whatsapp';

type ConnectionState = 'open' | 'connecting' | 'close' | 'unknown';

interface StatusResponse {
  instance?: { state?: string };
  state?: string;
}

function statusLabel(state: ConnectionState) {
  if (state === 'open') return 'Conectado';
  if (state === 'connecting') return 'Conectando';
  return 'Desconectado';
}

/**
 * Esta página cuida só da conexão do número. As cobranças saem de Assinaturas
 * e da Visão geral, para existir um caminho único de envio.
 */
export default function WhatsAppPage() {
  const [connState, setConnState] = useState<ConnectionState>('unknown');
  const [checking, setChecking] = useState(true);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const checkStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await apiFetch('/api/whatsapp-status');
      const data: StatusResponse = await res.json();
      const state = (data?.instance?.state ?? data?.state ?? 'close').toLowerCase();
      setConnState(state as ConnectionState);
      if (state === 'open') setQrBase64(null);
    } catch {
      setConnState('unknown');
    } finally {
      setChecking(false);
    }
  }, []);

  const fetchQr = useCallback(async () => {
    setLoadingQr(true);
    setQrBase64(null);
    try {
      const res = await apiFetch('/api/whatsapp-qr');
      const data = await res.json();
      if (data?.base64) {
        setQrBase64(data.base64.startsWith('data:') ? data.base64 : `data:image/png;base64,${data.base64}`);
      } else {
        toast.error(data?.error ?? 'Não foi possível gerar o QR Code.');
      }
    } catch {
      toast.error('Erro ao buscar o QR Code.');
    } finally {
      setLoadingQr(false);
    }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // Enquanto não está conectado, confere a cada 5 segundos
  useEffect(() => {
    if (connState !== 'open' && connState !== 'unknown') {
      const t = setInterval(checkStatus, 5000);
      return () => clearInterval(t);
    }
  }, [connState, checkStatus]);

  const isConnected = connState === 'open';
  const stateColor = isConnected ? 'var(--success)' : connState === 'connecting' ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="WhatsApp"
        subtitle="Conexão do número usado nos lembretes e cobranças."
      />

      {/* Status */}
      <section className="panel-raised p-5 sm:p-6">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                 style={{ background: isConnected ? 'oklch(95% 0.05 155)' : 'oklch(96% 0.045 25)' }}>
              {isConnected
                ? <Wifi className="w-5 h-5" style={{ color: 'var(--success)' }} />
                : <WifiOff className="w-5 h-5" style={{ color: 'var(--danger)' }} />}
            </div>
            <div>
              <p className="label-xs">Instância pacontrol</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: stateColor }} />
                <span className="text-[14px] font-semibold text-foreground">
                  {checking ? 'Verificando' : statusLabel(connState)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={checkStatus} disabled={checking} className="gap-1.5 flex-1 sm:flex-none">
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            {!isConnected && (
              <Button size="sm" onClick={fetchQr} disabled={loadingQr} className="gap-1.5 flex-1 sm:flex-none">
                <QrCode className="w-3.5 h-3.5" />
                {loadingQr ? 'Gerando' : 'Conectar'}
              </Button>
            )}
          </div>
        </div>

        {isConnected && (
          <p className="text-[12.5px] text-muted-foreground mt-4 pt-4 border-t border-border">
            O número está pronto. Os lembretes automáticos saem às 9h, com nova tentativa às 14h.
          </p>
        )}
      </section>

      {/* QR Code */}
      <AnimatePresence>
        {qrBase64 && !isConnected && (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="panel p-6 flex flex-col items-center gap-4"
          >
            <p className="text-[13px] text-muted-foreground text-center">
              No celular, abra o WhatsApp em Aparelhos conectados e escaneie:
            </p>
            <img src={qrBase64} alt="QR Code do WhatsApp" className="w-52 h-52 rounded-[11px] border border-border" />
            <p className="text-[11.5px] text-muted-foreground">O status atualiza sozinho depois da leitura.</p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Onde cobrar */}
      <Link to="/subscriptions" className="panel row-hover flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-[13.5px] font-semibold text-foreground">Enviar cobrança</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            As cobranças ficam em Assinaturas, junto de cada cliente.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </Link>
    </div>
  );
}
