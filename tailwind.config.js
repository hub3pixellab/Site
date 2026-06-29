/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
    './app/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  safelist: [
    // Cores dinâmicas
    'border-acidGreen', 'border-cyanElectric', 'border-magentaSunset', 'border-hubOrange',
    'text-acidGreen', 'text-cyanElectric', 'text-magentaSunset', 'text-hubOrange',
    'text-acidGreen/90', 'text-cyanElectric/90', 'text-magentaSunset/90', 'text-hubOrange/90',
    'bg-acidGreen', 'bg-cyanElectric', 'bg-magentaSunset', 'bg-hubOrange',
    'bg-acidGreen/5', 'bg-cyanElectric/5', 'bg-magentaSunset/5', 'bg-hubOrange/5',
    'bg-acidGreen/10', 'bg-cyanElectric/10', 'bg-magentaSunset/10', 'bg-hubOrange/10',
    'border-acidGreen/30', 'border-cyanElectric/30', 'border-magentaSunset/30', 'border-hubOrange/30',
    'border-acidGreen/40', 'border-cyanElectric/40', 'border-magentaSunset/40', 'border-hubOrange/40',
    'shadow-neon-green', 'shadow-neon-cyan', 'shadow-neon-magenta', 'shadow-neon-violet', 'shadow-neon-orange',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // Paleta do logo HUB3 PixelLab
        bgDark: '#06121F',         // navy profundo (fundo do logo)
        hubNavy: '#0A1A2E',         // navy intermediário
        hubNavyLight: '#13243C',    // navy claro para cards
        cyanElectric: '#22E0F5',    // cyan neon do "H3" no logo
        hubOrange: '#FF9416',       // laranja do "3" no logo
        hubGold: '#FFB347',         // dourado claro (highlight)
        // Mantidas para compatibilidade com componentes existentes
        ultraviolet: '#4F1487',
        acidGreen: '#CCFF00',
        magentaSunset: '#FF007A',
        cardBg: 'rgba(255,255,255,0.03)',
        border: 'rgba(255,255,255,0.08)',
        input: 'rgba(255,255,255,0.06)',
        ring: '#22E0F5',
        background: '#06121F',
        foreground: '#E8F4FF',
        primary: { DEFAULT: '#22E0F5', foreground: '#06121F' },
        secondary: { DEFAULT: '#FF9416', foreground: '#06121F' },
        muted: { DEFAULT: 'rgba(255,255,255,0.04)', foreground: 'rgba(232,244,255,0.6)' },
        accent: { DEFAULT: '#22E0F5', foreground: '#06121F' },
        destructive: { DEFAULT: '#FF007A', foreground: '#E8F4FF' },
        card: { DEFAULT: 'rgba(255,255,255,0.03)', foreground: '#E8F4FF' },
        popover: { DEFAULT: '#0A1A2E', foreground: '#E8F4FF' },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Orbitron', 'Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
      boxShadow: {
        'neon-green':   '0 0 12px rgba(204,255,0,0.55), 0 0 28px rgba(204,255,0,0.25)',
        'neon-cyan':    '0 0 12px rgba(34,224,245,0.65), 0 0 28px rgba(34,224,245,0.3)',
        'neon-magenta': '0 0 12px rgba(255,0,122,0.55), 0 0 28px rgba(255,0,122,0.25)',
        'neon-violet':  '0 0 12px rgba(79,20,135,0.65), 0 0 28px rgba(79,20,135,0.35)',
        'neon-orange':  '0 0 12px rgba(255,148,22,0.7), 0 0 30px rgba(255,148,22,0.35)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 8px rgba(34,224,245,0.45), 0 0 18px rgba(34,224,245,0.22)' },
          '50%':     { boxShadow: '0 0 18px rgba(34,224,245,0.9), 0 0 38px rgba(34,224,245,0.45)' },
        },
        'pulse-glow-orange': {
          '0%,100%': { boxShadow: '0 0 8px rgba(255,148,22,0.45), 0 0 18px rgba(255,148,22,0.22)' },
          '50%':     { boxShadow: '0 0 18px rgba(255,148,22,0.9), 0 0 38px rgba(255,148,22,0.45)' },
        },
        'scanline': {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        'flicker': {
          '0%,100%': { opacity: 1 },
          '45%':     { opacity: 0.85 },
          '50%':     { opacity: 0.4 },
          '55%':     { opacity: 0.95 },
        },
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pop': {
          '0%':   { transform: 'scale(1)', opacity: 1 },
          '50%':  { transform: 'scale(1.4)', opacity: 0.7 },
          '100%': { transform: 'scale(0)', opacity: 0 },
        },
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 600ms ease-out both',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'pulse-glow-orange': 'pulse-glow-orange 2.4s ease-in-out infinite',
        'scanline': 'scanline 6s linear infinite',
        'flicker': 'flicker 3.5s linear infinite',
        'shimmer': 'shimmer 2.6s linear infinite',
        'pop': 'pop 350ms ease-out forwards',
        'float-y': 'float-y 3.5s ease-in-out infinite',
      },
      backgroundImage: {
        'grid-neon': 'linear-gradient(rgba(34,224,245,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(34,224,245,0.06) 1px, transparent 1px)',
        'radial-cyan':  'radial-gradient(60% 60% at 50% 40%, rgba(34,224,245,0.25) 0%, rgba(6,18,31,0) 70%)',
        'radial-orange':'radial-gradient(45% 45% at 50% 50%, rgba(255,148,22,0.28) 0%, rgba(6,18,31,0) 70%)',
        'radial-navy':  'radial-gradient(80% 80% at 50% 50%, rgba(10,26,46,0.7) 0%, rgba(6,18,31,1) 90%)',
      },
      backgroundSize: {
        'grid-md': '40px 40px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
