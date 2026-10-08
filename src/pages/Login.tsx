import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';

const LOGO = 'https://iili.io/Bs2OL4s.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex bg-background">

      {/* Marca, só em tela grande */}
      <div className="hidden lg:flex w-[38%] flex-col justify-between p-10 bg-primary">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] overflow-hidden bg-primary-foreground/10">
            <img src={LOGO} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-[14px] font-semibold text-primary-foreground">PA Control</span>
        </div>

        <div>
          <h1 className="text-[34px] leading-[1.15] font-semibold text-primary-foreground max-w-[13ch]">
            Suas mensalidades em dia.
          </h1>
          <p className="text-[14px] text-primary-foreground/70 mt-3 max-w-[32ch]">
            Receba, cobre e acompanhe cada cliente em um lugar só.
          </p>
        </div>

        <p className="text-[11px] text-primary-foreground/50">© 2026 PA Control</p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[340px]"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-[11px] overflow-hidden bg-primary shrink-0">
              <img src={LOGO} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[15px] font-semibold text-foreground">PA Control</span>
          </div>

          <h2 className="text-[22px] font-semibold text-foreground">Entrar</h2>
          <p className="text-[13px] text-muted-foreground mt-1 mb-7">
            Acesse com o e-mail cadastrado.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="label-xs">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="login-input pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="label-xs">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="login-input pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 mt-2 text-[14px] font-semibold">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando
                </span>
              ) : 'Entrar'}
            </Button>
          </form>

          <p className="text-[11px] text-muted-foreground mt-10 lg:hidden">© 2026 PA Control</p>
        </motion.div>
      </div>
    </div>
  );
}
