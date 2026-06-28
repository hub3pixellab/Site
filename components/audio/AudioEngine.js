'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const AudioCtx = createContext(null);

/**
 * AudioEngine - integra-se ao SoundCloud Widget API.
 * Configuração:
 *  - Playlist privada padrão (substituível via Sanity no futuro).
 *  - Loop infinito.
 *  - Mute / Unmute global.
 *  - Crossfade de volume nas mudanças de rota.
 */
const DEFAULT_PLAYLIST_URL =
  process.env.NEXT_PUBLIC_SC_PLAYLIST_URL ||
  'https://soundcloud.com/massivejackmusic/sets/unreleased?secret_token=s-xH8mqZ5tU1d';

// Mapa de rota -> indice de faixa (pode ser editado via Sanity depois)
const ROUTE_TRACK_MAP = {
  '/': 0,
  '/holding': 1,
  '/portfolio': 2,
  '/contato': 3,
};

export function AudioProvider({ children }) {
  const iframeRef = useRef(null);
  const widgetRef = useRef(null);
  const fadeRafRef = useRef(null);
  const pathname = usePathname();

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true); // começa mudo por política de autoplay
  const [trackTitle, setTrackTitle] = useState('HUB3 Radio');
  const [trackIndex, setTrackIndex] = useState(0);
  const [playlistUrl] = useState(DEFAULT_PLAYLIST_URL);

  // Injeção do script da SoundCloud Widget API (uma única vez)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.SC && window.SC.Widget) return;
    const existing = document.querySelector('script[data-sc-widget]');
    if (existing) return;
    const s = document.createElement('script');
    s.src = 'https://w.soundcloud.com/player/api.js';
    s.async = true;
    s.setAttribute('data-sc-widget', '1');
    document.body.appendChild(s);
  }, []);

  // Inicialização do widget quando iframe estiver pronto
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (!iframeRef.current) return;
      if (!window.SC || !window.SC.Widget) {
        setTimeout(tryInit, 200);
        return;
      }
      try {
        const w = window.SC.Widget(iframeRef.current);
        widgetRef.current = w;
        w.bind(window.SC.Widget.Events.READY, () => {
          setReady(true);
          // começa mudo e em loop
          w.setVolume(0);
          w.bind(window.SC.Widget.Events.FINISH, () => {
            // toca a próxima e se for a última volta para o início (loop)
            w.getCurrentSoundIndex((idx) => {
              w.getSounds((sounds) => {
                const next = (idx + 1) % Math.max(sounds.length, 1);
                w.skip(next);
                w.play();
              });
            });
          });
          const refreshTitle = () => {
            try {
              w.getCurrentSound((s) => {
                if (s && s.title) setTrackTitle(s.title);
              });
            } catch (e) {}
          };
          w.bind(window.SC.Widget.Events.PLAY, () => {
            setIsPlaying(true);
            refreshTitle();
          });
          w.bind(window.SC.Widget.Events.PAUSE, () => setIsPlaying(false));
          w.bind(window.SC.Widget.Events.PLAY_PROGRESS, () => {
            setIsPlaying(true);
          });
          refreshTitle();
        });
      } catch (e) {
        // silencioso — falha de embed não deve quebrar a UI
      }
    };
    tryInit();
    return () => { cancelled = true; };
  }, []);

  const cancelFade = () => {
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
  };

  const fadeVolume = useCallback((from, to, duration = 900) => {
    if (!widgetRef.current) return;
    cancelFade();
    const start = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * k;
      try { widgetRef.current.setVolume(Math.max(0, Math.min(100, v))); } catch (e) {}
      if (k < 1) {
        fadeRafRef.current = requestAnimationFrame(step);
      } else {
        fadeRafRef.current = null;
      }
    };
    fadeRafRef.current = requestAnimationFrame(step);
  }, []);

  // Crossfade quando muda de rota (só quando som já estiver ativo)
  useEffect(() => {
    if (!ready || !widgetRef.current) return;
    const idx = ROUTE_TRACK_MAP[pathname];
    if (idx === undefined) return;
    const w = widgetRef.current;
    // fade out, troca faixa, fade in
    fadeVolume(muted ? 0 : 70, 0, 500);
    const timer = setTimeout(() => {
      try {
        w.skip(idx);
        setTrackIndex(idx);
        w.getCurrentSound((s) => { if (s && s.title) setTrackTitle(s.title); });
        if (!muted) fadeVolume(0, 70, 700);
      } catch (e) {}
    }, 520);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, ready]);

  const play = useCallback(() => {
    if (!widgetRef.current) return;
    try {
      widgetRef.current.play();
      if (!muted) fadeVolume(0, 70, 600);
    } catch (e) {}
  }, [muted, fadeVolume]);

  const pause = useCallback(() => {
    if (!widgetRef.current) return;
    try { widgetRef.current.pause(); } catch (e) {}
  }, []);

  const toggle = useCallback(() => {
    if (!widgetRef.current) return;
    try { widgetRef.current.toggle(); } catch (e) {}
  }, []);

  const setMutedState = useCallback((value) => {
    setMuted(value);
    if (!widgetRef.current) return;
    if (value) {
      fadeVolume(70, 0, 350);
    } else {
      // Garante que está tocando antes de subir o volume
      try { widgetRef.current.play(); } catch (e) {}
      fadeVolume(0, 70, 700);
    }
  }, [fadeVolume]);

  const toggleMute = useCallback(() => setMutedState(!muted), [muted, setMutedState]);

  const next = useCallback(() => {
    if (!widgetRef.current) return;
    try { widgetRef.current.next(); } catch (e) {}
  }, []);

  const value = {
    ready, isPlaying, muted, trackTitle, trackIndex, playlistUrl,
    play, pause, toggle, toggleMute, setMuted: setMutedState, next,
  };

  return (
    <AudioCtx.Provider value={value}>
      {children}
      {/* iframe escondido controlado via SoundCloud Widget API */}
      <iframe
        ref={iframeRef}
        title="HUB3 Audio Engine"
        aria-hidden="true"
        tabIndex={-1}
        width="1"
        height="1"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false&buying=false&sharing=false&download=false&show_artwork=false&single_active=false`}
        style={{ position: 'fixed', bottom: 0, right: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
