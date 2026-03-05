
'use client'

import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  delay?: number;
}

export default function MetricCard({ label, value, icon: Icon, trend, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#141414] border border-white/5 p-4 sm:p-6 rounded-2xl hover:border-white/10 transition-colors group"
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 bg-white/5 rounded-xl group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
          <Icon size={20} className="sm:w-6 sm:h-6" />
        </div>
        {trend && (
          <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</h3>
      </div>
    </motion.div>
  );
}
