/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Neon terminal HUD palette
        neon: {
          cyan: '#22e3ff',
          magenta: '#ff2bd6',
          green: '#39ff9e',
          amber: '#ffb347',
          red: '#ff3b52',
        },
        void: '#05070d',
        panel: '#0b0f1a',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity: '1' },
          '48%': { opacity: '0.85' },
          '50%': { opacity: '0.4' },
          '52%': { opacity: '0.9' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        flicker: 'flicker 3s infinite',
        scan: 'scan 6s linear infinite',
      },
    },
  },
  plugins: [],
}
