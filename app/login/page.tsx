'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4 relative overflow-hidden">
      <div className="w-48 h-24 relative mb-8 flex items-center justify-center z-10">
        <Image 
          src="https://iili.io/BsHmxFR.png" 
          alt="Logo" 
          fill
          className="object-contain"
          referrerPolicy="no-referrer"
          unoptimized
        />
      </div>

      <Card className="w-full max-w-md shadow-2xl bg-black/50 backdrop-blur-xl relative z-10 border-slate-800/60 p-4">
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0 py-6 text-base shadow-lg shadow-indigo-900/20" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
