import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        espresso:  '#1e110a',
        terracotta:'#b8674a',
        cream:     '#faf6ef',
        sand:      '#e8ddd0',
        mushroom:  '#8c7b6e',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
