/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#07080A',
        base: '#0B0D10',
        panel: '#111419',
        raised: '#171B21',
        line: '#222831',
        ink: '#E9ECEF',
        dim: '#8B939E',
        faint: '#525A66',
        signal: '#D4FF3A',
        alfred: '#9D7BFF',
        docintel: '#3FD8F2',
        hex: '#FF8A5C',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        frame: '88rem',
      },
    },
  },
  plugins: [],
};
