
'use client'

import { useState } from 'react';
import { Search, ArrowRight, Music } from 'lucide-react';
import { motion } from 'motion/react';

interface ArtistSearchProps {
  onSearch: (url: string) => void;
  isLoading: boolean;
}

export default function ArtistSearch({ onSearch, isLoading }: ArtistSearchProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSearch(url.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-[#141414] border border-white/10 rounded-2xl p-2 shadow-2xl gap-2 sm:gap-0">
          <div className="hidden sm:flex pl-4 text-white/40">
            <Music size={20} />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole o link do artista no Spotify..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/20 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-sans"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/20 text-black font-bold px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
          >
            {isLoading ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline">Analisar</span>
                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </motion.form>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-4 sm:mt-6 text-white/40 text-xs sm:text-sm font-mono uppercase tracking-widest"
      >
        Ex: https://open.spotify.com/artist/3TVXtAsR1InumH6p6PLSfv
      </motion.p>
    </div>
  );
}
