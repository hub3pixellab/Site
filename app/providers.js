'use client';
import React from 'react';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { UnlockProvider } from '@/components/layout/UnlockProvider';
import { AudioProvider } from '@/components/audio/AudioEngine';
import Nav from '@/components/layout/Nav';
import MiniPlayer from '@/components/audio/MiniPlayer';
import { Toaster } from 'sonner';

export default function Providers({ children }) {
  return (
    <I18nProvider>
      <UnlockProvider>
        <AudioProvider>
          <Nav />
          <main className="relative min-h-screen">{children}</main>
          <MiniPlayer />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: 'rgba(20,12,32,0.95)',
                border: '1px solid rgba(204,255,0,0.3)',
                color: '#f5f5ff',
                fontFamily: 'JetBrains Mono, monospace',
              },
            }}
          />
        </AudioProvider>
      </UnlockProvider>
    </I18nProvider>
  );
}
