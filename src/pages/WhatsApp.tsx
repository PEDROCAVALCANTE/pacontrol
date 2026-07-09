import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, RefreshCw, Send, Wifi, WifiOff, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSubscriptions } from '@/lib/data-store';
import { Subscription } from '@/lib/types';

type ConnectionState = 'open' | 'connecting' | 'close' | 'unknown';

interface StatusResponse {
  instance?: { state?: string };
  state?: string;
}

interface QrResponse {
  base64?: string;
  code?: string;
  error?: string;
}

interface SendModal {
  sub: Subscription;
  message: string;
}

function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, '');
  return clean.startsWith('55') ? clean : `55${clean}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function statusLabel(state: ConnectionState) {
  if (state === 'open') return 'Conectado';
  if (state === 'connecting') return 'Conectando…';
  return 'Desconectado';
}

export default function WhatsAppPage() {
  const [connState, setConnState] = useState<ConnectionState>('unknown');
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [sendModal, setSendModal] = useState<SendModal | null>(null);
  const [sending, setSending] = useState(false);

  const checkStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/whatsapp-status');
      const data: StatusResponse = await res.json();
      const state = (data?.instance?.state ?? data?.state ?? 'close').toLowerCase();
      setConnState(state as ConnectionState);
      if (state === 'open') setQrBase64(null);
    } catch {
      setConnState('unknown');
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  const fetchQr = useCallback(async () => {
    setLoadingQr(true);
    setQrBase64(null);
    try {
      const res = await fetch('/api/whatsapp-qr');
      const data: QrResponse = await res.json();
      if (data?.base64) {
        setQrBase64(data.base64.startsWith('data:') ? data.base64 : `data:image/png;base64,${data.base64}`);
      } else {
        toast.error('Não foi possível gerar QR Code');
      }
    } catch {
      toast.error('Erro ao buscar QR Code');
    } finally {
      setLoadingQr(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    getSubscriptions().then(s => setSubs(s.filter(x => x.status === 'active' && x.clientPhone)));
  }, [checkStatus]);

  // Poll status every 5s while connecting
  useEffect(() => {
    if (connState !== 'open' && connState !== 'unknown') {
      const t = setInterval(checkStatus, 5000);
      return () => clearInterval(t);
    }
  }, [connState, checkStatus]);

  const openSendModal = (sub: Subscription) => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const isPaid = sub.payments?.[monthKey] === true;
    const dueDay = sub.dueDay;
    const today = new Date().getDate();
    const diff = today - dueDay;

    let defaultMsg = '';
    if (isPaid) {
      defaultMsg = `Olá, *${sub.clientName}*! 👋\n\nObrigado pelo pagamento da sua mensalidade de *${formatCurrency(Number(sub.monthlyValue))}*! ✅\n\nQualquer dúvida é só chamar! 💬`;
    } else if (diff > 0) {
      defaultMsg = `🤖 _Mensagem automática do sistema de gestão PA Control_\n━━━━━━━━━━━━━━━━━━━━━━\n\nOlá, *${sub.clientName}*! 👋\n\n🚨 *Mensalidade em atraso!*\n\n📅 Venceu no *dia ${dueDay}* (${diff} dia${diff > 1 ? 's' : ''} em atraso)\n💵 Valor: *${formatCurrency(Number(sub.monthlyValue))}*\n\n━━━━━━━━━━━━━━━━━━━━━━\n💳 *Chave PIX:* 62991803975 (Nubank)\n━━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ Regularize para evitar interrupção do serviço.\n\nQualquer dúvida é só chamar! 💬🙏`;
    } else {
      defaultMsg = `Olá, *${sub.clientName}*! 👋\n\nTudo bem? Precisando de algo é só falar! 😊`;
    }

    setSendModal({ sub, message: defaultMsg });
  };

  const handleSend = async () => {
    if (!sendModal) return;
    setSending(true);
    try {
      const res = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sendModal.sub.clientPhone, message: sendModal.message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Erro ao enviar');
      toast.success(`Mensagem enviada para ${sendModal.sub.clientName}!`);
      setSendModal(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const isConnected = connState === 'open';

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        subtitle="Gerencie a conexão e envie mensagens para seus clientes."
      />

      {/* ── Status Card ───────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-[1.5rem] shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isConnected ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
            {isConnected ? <Wifi className="w-6 h-6 text-emerald-400" /> : <WifiOff className="w-6 h-6 text-red-400" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status Evolution API</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : connState === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="font-semibold text-foreground">{checkingStatus ? 'Verificando…' : statusLabel(connState)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={checkStatus} disabled={checkingStatus} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {!isConnected && (
            <Button size="sm" onClick={fetchQr} disabled={loadingQr} className="gap-2 bg-primary hover:bg-primary/90">
              <QrCode className="w-4 h-4" />
              {loadingQr ? 'Gerando…' : 'Conectar via QR'}
            </Button>
          )}
        </div>
      </div>

      {/* ── QR Code ───────────────────────────────────────────── */}
      <AnimatePresence>
        {qrBase64 && !isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-6 rounded-[1.5rem] shadow-lg flex flex-col items-center gap-4"
          >
            <p className="text-sm text-muted-foreground">Escaneie o QR Code com o WhatsApp do seu celular</p>
            <img src={qrBase64} alt="QR Code WhatsApp" className="w-56 h-56 rounded-xl border border-border/40" />
            <p className="text-xs text-muted-foreground">O status será atualizado automaticamente após a leitura.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Client List ───────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Clientes com WhatsApp
        </h2>

        {subs.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhum cliente ativo com telefone cadastrado.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {subs.map((sub, i) => {
              const monthKey = new Date().toISOString().slice(0, 7);
              const isPaid = sub.payments?.[monthKey] === true;
              const today = new Date().getDate();
              const diff = today - sub.dueDay;
              let badge = { label: 'Pendente', color: 'text-amber-400 bg-amber-400/10' };
              if (isPaid) badge = { label: 'Pago', color: 'text-emerald-400 bg-emerald-400/10' };
              else if (diff > 0) badge = { label: `${diff}d atraso`, color: 'text-red-400 bg-red-400/10' };

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-panel p-4 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{sub.clientName}</p>
                      <p className="text-xs text-muted-foreground">{formatPhone(sub.clientPhone ?? '')} · Vence dia {sub.dueDay} · {formatCurrency(Number(sub.monthlyValue))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge className={`border-none text-xs px-2 py-1 ${badge.color}`}>{badge.label}</Badge>
                    <Button
                      size="sm"
                      disabled={!isConnected}
                      onClick={() => openSendModal(sub)}
                      className="gap-2 bg-[#25D366] hover:bg-[#20b558] text-white disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Send Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {sendModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setSendModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Enviar mensagem</h3>
                  <p className="text-sm text-muted-foreground">{sendModal.sub.clientName} · {sendModal.sub.clientPhone}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSendModal(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <textarea
                rows={10}
                value={sendModal.message}
                onChange={e => setSendModal(m => m ? { ...m, message: e.target.value } : m)}
                className="w-full bg-background/50 border border-border/50 rounded-xl p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono leading-relaxed"
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSendModal(null)}>Cancelar</Button>
                <Button
                  onClick={handleSend}
                  disabled={sending || !sendModal.message.trim()}
                  className="gap-2 bg-[#25D366] hover:bg-[#20b558] text-white"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Enviando…' : 'Enviar WhatsApp'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
