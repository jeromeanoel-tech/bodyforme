import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Admin legacy colours
        espresso:  '#1e110a',
        terracotta:'#b8674a',
        cream:     '#faf6ef',
        sand:      '#e8ddd0',
        mushroom:  '#8c7b6e',
        // Design system tokens
        linen:  '#f4ede1',
        l2:     '#ede4d4',
        l3:     '#e4d8c6',
        esp:    '#2a1506',
        esp2:   '#3d2210',
        brown:  '#7a4a2a',
        blt:    '#a0724e',
        mid:    '#6b4e36',
        muted:  '#a08568',
        rule:   '#d8ccba',
        canvas: '#fdfaf6',
      },
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif:   ['var(--font-cormorant)', 'Georgia', 'serif'],
        jakarta: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
