
'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Music, ShieldCheck } from 'lucide-react';
import { BRANDING } from '@/lib/branding';

interface WelcomeScreenProps {
  onComplete: (name: string) => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-6 sm:space-y-8"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex p-3 sm:p-4 bg-emerald-500 rounded-3xl text-black mb-4 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
              >
                <Music size={32} className="sm:w-10 sm:h-10" strokeWidth={2.5} />
              </motion.div>
              
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
                  Sua jornada <br />
                  <span className="text-emerald-500">começa aqui.</span>
                </h1>
                <p className="text-white/40 text-base sm:text-lg md:text-xl font-sans max-w-md mx-auto">
                  Antes de analisarmos seus números, precisamos batizar seu espaço de trabalho.
                </p>
              </div>

              <motion.button
                onClick={() => setStep(2)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center gap-3 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition-all hover:bg-emerald-500"
              >
                CONFIGURAR IDENTIDADE <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 sm:space-y-12"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-500 font-mono text-xs uppercase tracking-[0.3em]">
                  <Sparkles size={14} /> Identificador Único
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight">Como devemos <br />te chamar?</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Alquimia Sonora"
                    className="w-full bg-transparent border-b-2 border-white/10 py-4 sm:py-6 text-2xl sm:text-3xl md:text-5xl font-bold focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-white/5"
                    required
                  />
                  <div className="absolute bottom-[-20px] left-0 text-[10px] font-mono uppercase text-white/20 tracking-widest">
                    Este será seu nome artístico no Insight Artístico
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 sm:pt-8">
                  <div className="flex items-center gap-3 text-white/40 text-sm">
                    <ShieldCheck size={18} className="text-emerald-500/50" />
                    <span>Seus dados são processados com segurança.</span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={name.trim().length < 2}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-black font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group"
                  >
                    CONFIRMAR IDENTIDADE <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-10 right-4 sm:right-10 flex justify-between items-center opacity-20 pointer-events-none">
        <div className="text-[10px] font-mono uppercase tracking-[0.5em]">{BRANDING.appName} v1.1</div>
        <div className="text-[10px] font-mono uppercase tracking-[0.5em]">© {BRANDING.year}</div>
      </div>
    </div>
  );
}
