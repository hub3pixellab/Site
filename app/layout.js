import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'HUB3 Lab — Corporate Portal',
  description: 'Web Presence, Gamification, Token Economics & Scalable Apps. House Lab · PixelLab · AppLab.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'HUB3 Lab',
    description: 'Gamified corporate portal — HUB3 Lab',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#0b0914',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-bgDark text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
