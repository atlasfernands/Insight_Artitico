
'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { Music, Mail, Lock, ArrowRight, Github, Chrome, User as UserIcon, Calendar, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WelcomeScreen from '@/components/WelcomeScreen';
import { AnimatePresence } from 'motion/react';
import { BRANDING } from '@/lib/branding';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [artistUrl, setArtistUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<'google' | 'github' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [artisticName, setArtisticName] = useState<string | null>(null);
  const [isCheckingArtisticName, setIsCheckingArtisticName] = useState(true);
  const router = useRouter();
  const isSupabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (session) {
        router.replace('/');
        return;
      }

      setIsCheckingSession(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (session) {
        router.replace('/');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    const storedName = localStorage.getItem('artistic_name');
    setArtisticName(storedName);
    setIsCheckingArtisticName(false);
  }, []);

  const handleWelcomeComplete = (name: string) => {
    localStorage.setItem('artistic_name', name);
    setArtisticName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        setIsLoading(false);
      } else {
        setMessage({ type: 'success', text: 'Login realizado com sucesso! Redirecionando...' });
        setTimeout(() => router.push('/'), 1500);
      }
    } else {
      // Sign Up
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            age: parseInt(age),
            artist_url: artistUrl,
          }
        }
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar.' });
      }
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    if (!isSupabaseConfigured) {
      setMessage({ type: 'error', text: 'Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para usar login social.' });
      return;
    }

    setMessage(null);
    setOauthLoadingProvider(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      }
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível iniciar o login social.' });
    } finally {
      setOauthLoadingProvider(null);
    }
  };

  if (isCheckingSession) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <AnimatePresence>
        {!artisticName && !isCheckingArtisticName && (
          <WelcomeScreen onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-4 sm:space-y-6 md:space-y-8 bg-[#141414] border border-white/5 p-4 sm:p-6 md:p-10 rounded-[24px] md:rounded-[32px] shadow-2xl"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-2 sm:p-3 md:p-4 bg-emerald-500 rounded-2xl text-black mb-2 md:mb-4">
            <Music className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h1>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest">{BRANDING.appName}</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isLogin ? 'bg-emerald-500 text-black' : 'text-white/40 hover:text-white'}`}
          >
            LOGIN
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isLogin ? 'bg-emerald-500 text-black' : 'text-white/40 hover:text-white'}`}
          >
            NOVA CONTA
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-3 md:py-4 pl-10 sm:pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">Idade</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Sua idade"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-3 md:py-4 pl-10 sm:pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    required={!isLogin}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">URL do Artista (Spotify)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="url" 
                    value={artistUrl}
                    onChange={(e) => setArtistUrl(e.target.value)}
                    placeholder="https://open.spotify.com/artist/..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-3 md:py-4 pl-10 sm:pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                    required={!isLogin}
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-3 md:py-4 pl-10 sm:pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 sm:py-3 md:py-4 pl-10 sm:pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                required
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {message.text}
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 sm:py-3 md:py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? 'PROCESSANDO...' : (isLogin ? 'ENTRAR' : 'CRIAR CONTA')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <div className="relative py-2 md:py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#141414] px-4 text-white/20 font-mono">Ou continue com</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading || oauthLoadingProvider !== null}
            className="flex items-center justify-center gap-2 py-3 px-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Chrome size={14} className="sm:w-4 sm:h-4" /> {oauthLoadingProvider === 'google' ? 'Conectando...' : 'Google'}
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin('github')}
            disabled={isLoading || oauthLoadingProvider !== null}
            className="flex items-center justify-center gap-2 py-3 px-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Github size={14} className="sm:w-4 sm:h-4" /> {oauthLoadingProvider === 'github' ? 'Conectando...' : 'GitHub'}
          </button>
        </div>

        <p className="text-center text-white/20 text-[10px] sm:text-xs">
          Ao continuar, você concorda com nossos <br className="sm:hidden" />
          <Link href="#" className="underline hover:text-white/40">Termos de Serviço</Link> e <Link href="#" className="underline hover:text-white/40">Privacidade</Link>.
        </p>
      </motion.div>
    </div>
  );
}
