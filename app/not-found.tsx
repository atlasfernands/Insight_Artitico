'use client'

import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="text-6xl font-bold text-emerald-500">404</div>
        <h1 className="text-2xl font-bold text-white">Página não encontrada</h1>
        <p className="text-white/40 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-2xl transition-all"
        >
          <Home size={18} /> Voltar ao início
        </Link>
      </div>
    </div>
  )
}