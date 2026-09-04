/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0b2545',
          darkBlue: '#134074',
          accentBlue: '#00509d',
          gold: '#c59b27',
          lightBg: '#f4f6f9',
          cardBg: '#ffffff',
          border: '#e2e8f0',
          textDark: '#1e293b',
          textMuted: '#64748b',
          success: '#15803d',
          danger: '#b91c1c',
          warning: '#b45309'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
