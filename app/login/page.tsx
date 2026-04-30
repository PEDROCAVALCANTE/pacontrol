'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#101114] p-4 sm:p-8 relative overflow-hidden font-sans">
      
      {/* Refined Background Gradients & Patterns */}
      <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
        
        {/* Topographic / Grid Pattern over background */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 blur-[120px]" />
        
        {/* Abstract lines simulation via multiple SVGs or pseudo elements, keeping simple with radial gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 opacity-50 blur-[1px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full border border-white/5 opacity-30 blur-[2px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] rounded-full border border-white/5 opacity-20 blur-[3px]" />
      </div>

      <div className="w-40 h-16 sm:w-48 sm:h-20 relative mb-8 flex items-center justify-center z-10 drop-shadow-lg">
        {/* Placeholder if logo changes, using the same one but well sized */}
        <Image 
          src="https://iili.io/Bs2OL4s.png" 
          alt="Logo" 
          fill
          className="object-contain"
          referrerPolicy="no-referrer"
          unoptimized
        />
      </div>

      <Card className="w-full max-w-sm shadow-2xl bg-[#1E1F24]/80 backdrop-blur-2xl relative z-10 border-white/5 p-4 sm:p-6 rounded-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="p-0 pb-6 text-center space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight text-white">
              Bem-vindo
            </CardTitle>
            <CardDescription className="text-slate-400">
              Faça login na sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-0">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-300">Endereço de E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@empresa.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#101114]/80 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/50 hover:border-white/20 transition-colors rounded-xl h-12 px-4 shadow-inner"
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-300">Senha</Label>
                {/* Optional logic for forgot password could go here */}
                {/* <a href="#" className="text-xs text-amber-500 hover:text-amber-400 transition-colors">Esqueceu a senha?</a> */}
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#101114]/80 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-amber-500/50 hover:border-white/20 transition-colors rounded-xl h-12 px-4 shadow-inner"
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="p-0 pt-8">
            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white border-0 py-6 text-base font-medium shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all rounded-xl" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Autenticando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* Decorative tiny text at bottom */}
      <div className="absolute bottom-6 text-slate-500 text-xs font-medium tracking-wide z-10 flex gap-4">
        <span>© 2026 PA Control</span>
        {/* <span>Privacidade</span> */}
        {/* <span>Termos</span> */}
      </div>
    </div>
  );
}
