
'use client'

import { useState, useEffect, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Users, Star, ExternalLink, Disc, Users2, AlertTriangle, Upload, BarChart3, TrendingUp, CalendarRange } from 'lucide-react';
import { motion } from 'motion/react';
import MetricCard from './MetricCard';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { parseSpotifyStreamingCsv, type StreamingChartPoint } from '@/lib/spotifyCsv';

interface DashboardProps {
  data: any;
}

const mockChartData = [
  { name: 'Jan', listeners: 4000 },
  { name: 'Fev', listeners: 3000 },
  { name: 'Mar', listeners: 5000 },
  { name: 'Abr', listeners: 4500 },
  { name: 'Mai', listeners: 6000 },
  { name: 'Jun', listeners: 8000 },
];

function normalizeChartPoints(rawPoints: unknown): StreamingChartPoint[] {
  if (!Array.isArray(rawPoints)) {
    return [];
  }

  const normalized: StreamingChartPoint[] = [];
  let previousAccumulatedStreams = 0;

  rawPoints.forEach((point, index) => {
    if (typeof point !== 'object' || point === null) {
      return;
    }

    const candidate = point as { date?: unknown; streams?: unknown; dailyStreams?: unknown };
    if (typeof candidate.date !== 'string' || typeof candidate.streams !== 'number') {
      return;
    }

    const streams = Math.max(0, Math.round(candidate.streams));
    const fallbackDailyStreams = index === 0 ? streams : Math.max(0, streams - previousAccumulatedStreams);
    const dailyStreams =
      typeof candidate.dailyStreams === 'number' && Number.isFinite(candidate.dailyStreams)
        ? Math.max(0, Math.round(candidate.dailyStreams))
        : fallbackDailyStreams;

    normalized.push({
      date: candidate.date,
      streams,
      dailyStreams,
    });

    previousAccumulatedStreams = streams;
  });

  return normalized;
}

export default function Dashboard({ data }: DashboardProps) {
  const { artist, topTracks, relatedArtists, albums } = data;
  const [isMounted, setIsMounted] = useState(false);
  const [csvChartData, setCsvChartData] = useState<StreamingChartPoint[] | null>(null);
  const [csvFeedback, setCsvFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const csvStorageKey = `spotify-streaming-csv:${artist.id}`;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(csvStorageKey);
      if (!storedData) {
        setCsvChartData(null);
        return;
      }

      const parsed = JSON.parse(storedData) as unknown;
      const normalized = normalizeChartPoints(parsed);

      if (normalized.length > 0) {
        setCsvChartData(normalized);
      } else {
        setCsvChartData(null);
      }
    } catch {
      setCsvChartData(null);
    }
  }, [csvStorageKey]);

  const formatDateLabel = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) {
      return isoDate;
    }

    return `${day}/${month}`;
  };

  const chartData = csvChartData && csvChartData.length > 0
    ? csvChartData.map((point) => ({
      name: formatDateLabel(point.date),
      listeners: point.streams,
      dailyStreams: point.dailyStreams,
      fullDate: point.date,
    }))
    : mockChartData;

  const csvSummary = csvChartData && csvChartData.length > 0
    ? (() => {
      const totalDays = csvChartData.length;
      const totalStreams = csvChartData[totalDays - 1]?.streams ?? 0;
      const averageDailyStreams = Math.round(totalStreams / totalDays);
      const bestDay = csvChartData.reduce((best, current) => (
        current.dailyStreams > best.dailyStreams ? current : best
      ), csvChartData[0]);

      return {
        totalStreams,
        averageDailyStreams,
        bestDay,
        totalDays,
        firstDate: csvChartData[0]?.date,
        lastDate: csvChartData[totalDays - 1]?.date,
      };
    })()
    : null;

  const handleCsvUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    try {
      const csvContent = await selectedFile.text();
      const parsed = parseSpotifyStreamingCsv(csvContent);

      setCsvChartData(parsed.points);
      localStorage.setItem(csvStorageKey, JSON.stringify(parsed.points));
      setCsvFeedback({
        type: 'success',
        text: `CSV importado: ${parsed.stats.validRows} linhas válidas e ${parsed.stats.duplicateDates} datas repetidas somadas automaticamente.`,
      });
    } catch (error) {
      setCsvFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Não foi possível importar o CSV.',
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Mock Data Warning */}
      {artist.isMock && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-amber-500 text-sm"
        >
          <AlertTriangle size={20} />
          <div>
            <p className="font-bold">Modo de Demonstração</p>
            <p className="opacity-80">As credenciais do Spotify não foram configuradas. Exibindo dados de exemplo.</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 items-center sm:items-end">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-3xl overflow-hidden border-4 border-white/5 shadow-2xl flex-shrink-0"
        >
          <Image 
            src={artist.images[0]?.url || 'https://picsum.photos/seed/artist/400/400'} 
            alt={artist.name}
            fill
            sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-2">
            {artist.genres?.map((genre: string) => (
              <span key={genre} className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/60">
                {genre}
              </span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-7xl font-bold tracking-tighter leading-tight">{artist.name}</h1>
          <div className="pt-2">
            <a 
              href={artist.external_urls?.spotify} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 font-mono text-xs sm:text-sm transition-colors"
            >
              VER NO SPOTIFY <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard 
          label="Seguidores" 
          value={artist.followers?.total?.toLocaleString() || '0'} 
          icon={Users} 
          trend="+12%"
          delay={0.1}
        />
        <MetricCard 
          label="Popularidade" 
          value={`${artist.popularity || 0}/100`} 
          icon={Star} 
          delay={0.2}
        />
        <MetricCard 
          label="Álbuns/Singles" 
          value={albums?.length || 0} 
          icon={Disc} 
          delay={0.3}
        />
        <MetricCard 
          label="Artistas Relacionados" 
          value={relatedArtists?.length || 0} 
          icon={Users2} 
          delay={0.4}
        />
      </div>

      {csvSummary && (
        <div className="space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/80">Métricas avançadas do CSV</p>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard
              label="Streams Totais"
              value={csvSummary.totalStreams.toLocaleString('pt-BR')}
              icon={BarChart3}
              delay={0.45}
            />
            <MetricCard
              label="Média Diária"
              value={csvSummary.averageDailyStreams.toLocaleString('pt-BR')}
              icon={TrendingUp}
              trend="por dia"
              delay={0.5}
            />
            <MetricCard
              label="Pico Diário"
              value={csvSummary.bestDay.dailyStreams.toLocaleString('pt-BR')}
              icon={Star}
              trend={formatDateLabel(csvSummary.bestDay.date)}
              delay={0.55}
            />
            <MetricCard
              label="Período CSV"
              value={`${csvSummary.totalDays} dias`}
              icon={CalendarRange}
              trend={`${formatDateLabel(csvSummary.firstDate)} - ${formatDateLabel(csvSummary.lastDate)}`}
              delay={0.6}
            />
          </div>
        </div>
      )}

      {/* Charts & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Growth Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-[#141414] border border-white/5 p-4 sm:p-8 rounded-3xl"
        >
          <div className="mb-6 sm:mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">Crescimento de Streams</h3>
              <div className="flex gap-2 items-center">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-mono text-white/40 uppercase">
                  {csvChartData?.length ? 'Streams acumulados (CSV)' : 'Ouvintes'}
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors cursor-pointer w-fit">
                <Upload size={14} /> Importar CSV do Spotify
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </label>
              {csvChartData?.length ? (
                <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/80">
                  {csvChartData.length} pontos carregados • total {csvSummary?.totalStreams.toLocaleString('pt-BR')} streams
                </p>
              ) : null}
            </div>

            {csvFeedback && (
              <div className={`p-3 rounded-xl text-xs font-medium ${csvFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {csvFeedback.text}
              </div>
            )}
          </div>
          <div className="h-[300px] w-full relative">
            {isMounted ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorListeners" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffffff20" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#ffffff20" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                      itemStyle={{ color: '#10b981' }}
                      labelFormatter={(label, payload) => {
                        const tooltipDate = payload?.[0]?.payload?.fullDate;
                        const tooltipDailyStreams = payload?.[0]?.payload?.dailyStreams;

                        if (tooltipDate && typeof tooltipDailyStreams === 'number') {
                          return `${tooltipDate} • +${Number(tooltipDailyStreams).toLocaleString('pt-BR')} no dia`;
                        }

                        return tooltipDate || label;
                      }}
                      formatter={(value) => [Number(value).toLocaleString('pt-BR'), 'Streams acumulados']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="listeners" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorListeners)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-full bg-white/5 animate-pulse rounded-2xl" />
            )}
          </div>
        </motion.div>

        {/* Top Tracks */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#141414] border border-white/5 p-4 sm:p-8 rounded-3xl"
        >
          <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-4 sm:mb-6">Músicas em Destaque</h3>
          <div className="space-y-3 sm:space-y-4">
            {topTracks?.slice(0, 5).map((track: any, i: number) => (
              <div key={track.id} className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
                <span className="text-white/20 font-mono text-xs sm:text-sm w-4">{i + 1}</span>
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <Image 
                    src={track.album.images[0]?.url} 
                    alt={track.name} 
                    fill
                    sizes="(max-width: 640px) 40px, 48px"
                    className="object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold truncate group-hover:text-emerald-500 transition-colors">{track.name}</p>
                  <p className="text-[10px] sm:text-xs text-white/40 truncate">{track.album.name}</p>
                </div>
                <div className="text-[10px] font-mono text-white/20 hidden sm:block">
                  {Math.floor(track.duration_ms / 60000)}:{(Math.floor((track.duration_ms % 60000) / 1000)).toString().padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Albums & Related */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-[#141414] border border-white/5 p-4 sm:p-8 rounded-3xl"
        >
          <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-4 sm:mb-6 flex items-center gap-2">
            <Disc size={18} className="text-emerald-500" /> Últimos Lançamentos
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {albums?.slice(0, 4).map((album: any) => (
              <div key={album.id} className="space-y-2 group cursor-pointer">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-white/5">
                  <Image 
                    src={album.images[0]?.url} 
                    alt={album.name} 
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-xs font-bold truncate">{album.name}</p>
                <p className="text-[10px] text-white/40 font-mono uppercase">{album.release_date.split('-')[0]}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-[#141414] border border-white/5 p-4 sm:p-8 rounded-3xl"
        >
          <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-4 sm:mb-6 flex items-center gap-2">
            <Users2 size={18} className="text-emerald-500" /> Artistas Relacionados
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {relatedArtists?.slice(0, 5).map((rel: any) => (
              <div key={rel.id} className="flex items-center gap-3 sm:gap-4 group cursor-pointer">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10">
                  <Image 
                    src={rel.images[0]?.url || 'https://picsum.photos/seed/rel/100/100'} 
                    alt={rel.name} 
                    fill
                    sizes="(max-width: 640px) 32px, 40px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold group-hover:text-emerald-500 transition-colors">{rel.name}</p>
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-tighter">
                    {rel.genres?.slice(0, 2).join(' • ')}
                  </p>
                </div>
                <div className="text-xs font-mono text-emerald-500/60">{rel.popularity}%</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
