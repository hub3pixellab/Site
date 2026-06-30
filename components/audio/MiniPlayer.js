'use client';
import { useAudio } from '@/components/audio/AudioEngine';
import { useI18n } from '@/components/i18n/I18nProvider';
import { Volume2, VolumeX, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MiniPlayer() {
  // Rádio sempre tocando — controle apenas mute/unmute + volume (mute=volume off).
  // Quando desmutado, exibe artista/track.
  const { muted, trackTitle, toggleMute, ready } = useAudio();
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.6 }}
      className="fixed bottom-4 right-4 z-50 glass rounded-full pl-3 pr-1.5 py-1.5 flex items-center gap-2 font-mono text-xs shadow-neon-cyan"
      data-testid="mini-player"
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full ${ready && !muted ? 'bg-acidGreen animate-ping' : 'bg-foreground/30'}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${ready && !muted ? 'bg-acidGreen' : 'bg-foreground/40'}`} />
        </span>
        <Radio className="h-3.5 w-3.5 text-acidGreen" />
        <span className="text-acidGreen tracking-widest text-[10px]">{t('audio.live')}</span>
      </div>

      <AnimatePresence mode="wait">
        {!muted && (
          <motion.div
            key="track"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden whitespace-nowrap text-foreground/85 max-w-[180px] truncate"
            title={trackTitle}
          >
            <span className="px-1">{trackTitle || 'HUB3 Radio'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleMute}
        title={muted ? t('audio.unmute') : t('audio.mute')}
        data-testid="mini-player-mute"
        className={`ml-auto p-2 rounded-full transition-all ${
          muted
            ? 'text-foreground/55 hover:text-cyanElectric hover:bg-cyanElectric/10'
            : 'text-acidGreen bg-acidGreen/15 shadow-neon-green'
        }`}
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
    </motion.div>
  );
}
