/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
    './app/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  safelist: [
    // Cores dinâmicas das divisões / nós interativos
    'border-acidGreen', 'border-cyanElectric', 'border-magentaSunset',
    'text-acidGreen', 'text-cyanElectric', 'text-magentaSunset',
    'text-acidGreen/90', 'text-cyanElectric/90', 'text-magentaSunset/90',
    'bg-acidGreen', 'bg-cyanElectric', 'bg-magentaSunset',
    'bg-acidGreen/5', 'bg-cyanElectric/5', 'bg-magentaSunset/5',
    'bg-acidGreen/10', 'bg-cyanElectric/10', 'bg-magentaSunset/10',
    'border-acidGreen/30', 'border-cyanElectric/30', 'border-magentaSunset/30',
    'border-acidGreen/40', 'border-cyanElectric/40', 'border-magentaSunset/40',
    'shadow-neon-green', 'shadow-neon-cyan', 'shadow-neon-magenta', 'shadow-neon-violet',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        bgDark: '#0b0914',
        ultraviolet: '#4F1487',
        acidGreen: '#CCFF00',
        cyanElectric: '#00F0FF',
        magentaSunset: '#FF007A',
        cardBg: 'rgba(255,255,255,0.03)',
        border: 'rgba(255,255,255,0.08)',
        input: 'rgba(255,255,255,0.06)',
        ring: '#CCFF00',
        background: '#0b0914',
        foreground: '#f5f5ff',
        primary: { DEFAULT: '#CCFF00', foreground: '#0b0914' },
        secondary: { DEFAULT: '#4F1487', foreground: '#f5f5ff' },
        muted: { DEFAULT: 'rgba(255,255,255,0.04)', foreground: 'rgba(255,255,255,0.6)' },
        accent: { DEFAULT: '#00F0FF', foreground: '#0b0914' },
        destructive: { DEFAULT: '#FF007A', foreground: '#f5f5ff' },
        card: { DEFAULT: 'rgba(255,255,255,0.03)', foreground: '#f5f5ff' },
        popover: { DEFAULT: '#120c1f', foreground: '#f5f5ff' },
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
        'neon-green': '0 0 12px rgba(204,255,0,0.55), 0 0 28px rgba(204,255,0,0.25)',
        'neon-cyan':  '0 0 12px rgba(0,240,255,0.55), 0 0 28px rgba(0,240,255,0.25)',
        'neon-magenta':'0 0 12px rgba(255,0,122,0.55), 0 0 28px rgba(255,0,122,0.25)',
        'neon-violet':'0 0 12px rgba(79,20,135,0.65), 0 0 28px rgba(79,20,135,0.35)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'pulse-glow': {
          '0%,100%': { boxShadow: '0 0 8px rgba(204,255,0,0.4), 0 0 18px rgba(204,255,0,0.2)' },
          '50%':     { boxShadow: '0 0 18px rgba(204,255,0,0.85), 0 0 38px rgba(204,255,0,0.4)' },
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
      },
      animation: {
        'fade-in': 'fade-in 600ms ease-out both',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'scanline': 'scanline 6s linear infinite',
        'flicker': 'flicker 3.5s linear infinite',
        'shimmer': 'shimmer 2.6s linear infinite',
      },
      backgroundImage: {
        'grid-neon': 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'radial-violet': 'radial-gradient(60% 60% at 50% 40%, rgba(79,20,135,0.45) 0%, rgba(11,9,20,0) 70%)',
        'radial-acid':   'radial-gradient(40% 40% at 50% 50%, rgba(204,255,0,0.25) 0%, rgba(11,9,20,0) 70%)',
      },
      backgroundSize: {
        'grid-md': '40px 40px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
