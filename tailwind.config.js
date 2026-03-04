/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: { 50:'#FAF8F3', 100:'#F5F0E8', 200:'#EDE4D0', 300:'#E0D4B8' },
        mahogany:  { 700:'#6B2D0E', 800:'#4A1F0A', 900:'#2A1810' },
        gold:      { 300:'#E8C470', 400:'#D4A843', 500:'#C9973A', 600:'#A67C2E' },
        ink:       { 50:'#E8ECF4', 800:'#1C2333', 900:'#0D1117' },
        leather:   { DEFAULT:'#2A1810', light:'#4A3020' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif:   ['"Lora"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'parchment-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { from:{ opacity:0 }, to:{ opacity:1 } },
        slideUp:   { from:{ opacity:0, transform:'translateY(12px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        glowPulse: { '0%,100%':{ boxShadow:'0 0 8px rgba(201,151,58,0.3)' }, '50%':{ boxShadow:'0 0 20px rgba(201,151,58,0.6)' } },
        shimmer:   { '0%':{ backgroundPosition:'-200% 0' }, '100%':{ backgroundPosition:'200% 0' } },
      },
    },
  },
  plugins: [],
};
