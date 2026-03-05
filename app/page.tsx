
'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Sparkles, AlertCircle, RefreshCcw, LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ArtistSearch from '@/components/ArtistSearch';
import Dashboard from '@/components/Dashboard';
import WelcomeScreen from '@/components/WelcomeScreen';
import { lookupArtist } from '@/app/actions';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { BRANDING } from '@/lib/branding';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artistData, setArtistData] = useState<any>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [artisticName, setArtisticName] = useState<string | null>(null);
  const [isCheckingArtisticName, setIsCheckingArtisticName] = useState(true);

  useEffect(() => {
    const storedName = localStorage.getItem('artistic_name');
    setArtisticName(storedName);
    setIsCheckingArtisticName(false);
  }, []);

  const handleWelcomeComplete = (name: string) => {
    localStorage.setItem('artistic_name', name);
    setArtisticName(name);
  };

  useEffect(() => {
    let isMounted = true;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (!session) {
        router.replace('/login');
        return;
      }

      setUser(session?.user || null);
      setIsCheckingSession(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session) {
        setUser(null);
        router.replace('/login');
        return;
      }

      setUser(session.user);
      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.replace('/login');
  };

  const handleSearch = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setInsight(null);
    
    try {
      const result = await lookupArtist(url);
      if (result.success) {
        setArtistData(result.data);
        generateInsight(result.data);
      } else {
        setError(result.error || 'Não foi possível encontrar o artista.');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsight = async (data: any) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
      
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        setInsight("Mantenha o foco na consistência dos lançamentos para aumentar sua base de fãs.");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `Analise brevemente o perfil deste artista do Spotify: 
          Nome: ${data.artist.name}
          Seguidores: ${data.artist.followers.total}
          Popularidade: ${data.artist.popularity}/100
          Gêneros: ${data.artist.genres.join(', ')}
          Top Tracks: ${data.topTracks.map((t: any) => t.name).join(', ')}
          
          Forneça um insight criativo e estratégico em português (máximo 3 frases) sobre o momento da carreira dele.`,
      });
      setInsight(response.text || null);
    } catch (err) {
      console.error('Erro ao gerar insight:', err);
      setInsight("Analise seus números de ouvintes mensais para identificar tendências de crescimento sazonais.");
    }
  };

  return (
    isCheckingSession ? (
      <main className="min-h-screen" />
    ) : (
    <main className="min-h-screen pb-20">
      <AnimatePresence>
        {!artisticName && !isCheckingArtisticName && (
          <WelcomeScreen onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>

      {/* Navbar / Auth Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] uppercase tracking-[0.3em]">
          <Sparkles size={14} /> {artisticName || BRANDING.appName}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-2 sm:px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                  <UserIcon size={14} />
                </div>
                <span className="text-[10px] sm:text-xs font-mono text-white/60 truncate max-w-[60px] sm:max-w-[120px]">{user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-white/20 hover:text-red-500 transition-colors ml-1 sm:ml-0"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link 
              href="/login"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-3 sm:px-6 py-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest transition-all"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* Hero Section - Simplified to just search */}
      <div className={`relative transition-all duration-1000 ${artistData ? 'pt-8 sm:pt-12 pb-8' : 'pt-20 sm:pt-32 pb-12 sm:pb-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {!artistData ? (
              <motion.div 
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6 sm:space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono uppercase tracking-widest">
                  <Sparkles size={14} /> {BRANDING.heroBadge}
                </div>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter max-w-4xl mx-auto leading-[0.9]">
                  Seus números, <br />
                  <span className="text-emerald-500">sua arte.</span>
                </h1>
                <p className="text-white/40 text-base sm:text-lg max-w-xl mx-auto font-sans">
                  Cole a URL do seu artista no Spotify para analisar sua performance.
                </p>
                <ArtistSearch onSearch={handleSearch} isLoading={isLoading} />
              </motion.div>
            ) : (
              <motion.div 
                key="search-mini"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mb-8 sm:mb-12 border-b border-white/5 pb-6 sm:pb-8"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-emerald-500 rounded-2xl text-black">
                    <Music size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight">{BRANDING.appName}</h2>
                    <p className="text-white/40 text-xs font-mono uppercase tracking-widest">{BRANDING.panelSubtitle}</p>
                  </div>
                </div>
                <div className="flex-1 max-w-md w-full">
                  <ArtistSearch onSearch={handleSearch} isLoading={isLoading} />
                </div>
                <button 
                  onClick={() => setArtistData(null)}
                  className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-mono uppercase"
                >
                  <RefreshCcw size={16} /> Nova Busca
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm"
            >
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}

          {artistData && (
            <div className="space-y-8">
              {insight && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 p-8 rounded-3xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={120} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-emerald-400 text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Sparkles size={14} /> Insight da IA
                    </h4>
                    <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-white/90">
                      &quot;{insight}&quot;
                    </p>
                  </div>
                </motion.div>
              )}
              <Dashboard data={artistData} />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-white/5 text-center">
        <p className="text-white/20 text-xs sm:text-sm font-mono uppercase tracking-widest">
          {BRANDING.appName} &copy; {BRANDING.year} &bull; Criado por {BRANDING.creator} &bull; Powered by Spotify API & Gemini AI
        </p>
      </footer>

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      </div>
    </main>
    )
  );
}
