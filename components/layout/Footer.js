'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative z-20 border-t border-cyanElectric/15 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" data-testid="footer-logo">
          <div className="relative w-7 h-7 rounded-md overflow-hidden border border-cyanElectric/30">
            <Image src="/logo-hub3.jpg" alt="HUB3" fill className="object-cover" sizes="28px" />
          </div>
          <span className="font-display tracking-[0.22em] text-xs">
            <span className="text-foreground">HUB</span>
            <span className="text-cyanElectric">3</span>
            <span className="text-hubOrange ml-1">PIXEL LAB</span>
          </span>
        </Link>

        <div className="font-mono text-[10px] md:text-[11px] text-foreground/55 tracking-widest text-center">
          © 2026 HUB3 PIXEL LAB · ALL RIGHTS RESERVED
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://instagram.com/hub3pixellab"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="footer-instagram"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-hubOrange/40 text-hubOrange font-mono text-[10px] tracking-widest hover:bg-hubOrange/10 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            @hub3pixellab
          </a>
        </div>
      </div>
      <div className="text-center pb-4 font-mono text-[9px] text-foreground/30 tracking-[0.3em]">
        BUILT WITH <Heart className="w-2.5 h-2.5 inline text-hubOrange" /> IN BRAZIL
      </div>
    </footer>
  );
}
