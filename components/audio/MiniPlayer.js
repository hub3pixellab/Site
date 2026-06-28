'use client';
import { useAudio } from '@/components/audio/AudioEngine';
import { useI18n } from '@/components/i18n/I18nProvider';
import { Play, Pause, Volume2, VolumeX, SkipForward, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MiniPlayer() {
  const { isPlaying, muted, trackTitle, toggle, toggleMute, next, ready } = useAudio();
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="fixed bottom-4 right-4 z-50 glass rounded-lg px-3 py-2 flex items-center gap-3 font-mono text-xs shadow-neon-violet"
      style={{ minWidth: 260, maxWidth: 360 }}
    >
      <div className="flex items-center gap-2 pr-2 border-r border-border">
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full ${ready && !muted ? 'bg-acidGreen animate-ping' : 'bg-foreground/30'}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${ready && !muted ? 'bg-acidGreen' : 'bg-foreground/40'}`} />
        </span>
        <Radio className="h-3.5 w-3.5 text-acidGreen" />
        <span className="text-acidGreen tracking-widest">{t('audio.live')}</span>
      </div>
      <div className="flex-1 truncate text-foreground/80" title={trackTitle}>
        {trackTitle || 'HUB3 Radio'}
      </div>
      <button onClick={toggle} title={isPlaying ? t('audio.pause') : t('audio.play')} className="p-1.5 rounded-md hover:bg-acidGreen/10 hover:text-acidGreen transition-all">
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <button onClick={next} title={t('audio.next')} className="p-1.5 rounded-md hover:bg-cyanElectric/10 hover:text-cyanElectric transition-all">
        <SkipForward className="h-3.5 w-3.5" />
      </button>
      <button onClick={toggleMute} title={muted ? t('audio.unmute') : t('audio.mute')} className={`p-1.5 rounded-md transition-all ${muted ? 'text-foreground/50 hover:text-magentaSunset hover:bg-magentaSunset/10' : 'text-acidGreen bg-acidGreen/10 shadow-neon-green'}`}>
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </motion.div>
  );
}
