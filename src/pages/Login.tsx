import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';

const LOGO = 'https://iili.io/Bs2OL4s.png';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
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
    <div className="min-h-screen flex bg-[#060A0F]">

      {/* ── Left panel — branding ─────────────────────────────── */}
      <div className="hidden lg:flex w-[42%] flex-col items-center justify-center relative overflow-hidden px-12"
           style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,106,0,0.07) 0%, transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 relative z-10"
        >
          <img src={LOGO} alt="PA Control" className="w-24 h-24 rounded-2xl object-cover shadow-2xl" />
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white tracking-tight">PA Control</h1>
            <p className="text-sm text-white/40 mt-2 tracking-wide">Gestão financeira simplificada</p>
          </div>

          {/* Decorative dots */}
          <div className="flex gap-2 mt-4">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full"
                   style={{ background: i === 1 ? '#FF6A00' : 'rgba(255,255,255,0.15)' }} />
            ))}
          </div>
        </motion.div>

        <p className="absolute bottom-8 text-[11px] text-white/20 tracking-widest uppercase">
          © 2026 PA Control
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12">

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="lg:hidden mb-10 flex flex-col items-center gap-3"
        >
          <img src={LOGO} alt="PA Control" className="w-16 h-16 rounded-xl object-cover shadow-xl" />
          <p className="text-sm font-medium text-white/50">PA Control</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white tracking-tight">Bem-vindo de volta</h2>
            <p className="text-sm text-white/40 mt-1">Entre com suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-white/50 uppercase tracking-wider">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
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

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-white/50 uppercase tracking-wider">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 font-medium tracking-wide rounded-xl text-sm"
              style={{ background: '#FF6A00', color: '#fff' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Autenticando...
                </span>
              ) : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-[11px] text-white/20 mt-10 tracking-wider uppercase lg:hidden">
            © 2026 PA Control
          </p>
        </motion.div>
      </div>
    </div>
  );
}
