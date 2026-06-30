'use client';
import React from 'react';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { UnlockProvider } from '@/components/layout/UnlockProvider';
import { RegistrationProvider } from '@/components/layout/RegistrationProvider';
import { AudioProvider } from '@/components/audio/AudioEngine';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import MiniPlayer from '@/components/audio/MiniPlayer';
import { Toaster } from 'sonner';

export default function Providers({ children }) {
  return (
    <I18nProvider>
      <RegistrationProvider>
        <UnlockProvider>
          <AudioProvider>
            <Nav />
            <main className="relative min-h-screen">{children}</main>
            <Footer />
            <MiniPlayer />
            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  background: 'rgba(10,26,46,0.95)',
                  border: '1px solid rgba(34,224,245,0.35)',
                  color: '#E8F4FF',
                  fontFamily: 'JetBrains Mono, monospace',
                },
              }}
            />
          </AudioProvider>
        </UnlockProvider>
      </RegistrationProvider>
    </I18nProvider>
  );
}
