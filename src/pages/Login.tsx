import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

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
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 relative overflow-hidden font-sans">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://iili.io/BmnrVl2.gif")' }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="mb-8 flex items-center justify-center z-10 drop-shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
            <img src="https://iili.io/Bs2OL4s.png" alt="PA Control Logo" className="w-full h-full object-cover" />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full max-w-sm relative z-10">
        <Card className="w-full shadow-xl glass-panel p-6 sm:p-8 rounded-xl">
          <form onSubmit={handleLogin}>
          <CardHeader className="p-0 pb-8 text-center space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Bem-vindo
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Faça login na sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-0">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Endereço de E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@empresa.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 px-4"
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Senha</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 px-4"
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="p-0 pt-8">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-sm font-medium tracking-wide shadow-sm transition-all rounded-lg" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Autenticando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </CardFooter>
        </form>
        </Card>
      </motion.div>
      
      {/* Decorative tiny text at bottom */}
      <div className="absolute bottom-6 text-muted-foreground text-xs font-medium tracking-wider z-10 flex gap-4">
        <span>© 2026 PA Control</span>
      </div>
    </div>
  );
}
