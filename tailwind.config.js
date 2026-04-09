/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ibm-blue': {
          50: '#EDF5FF',
          100: '#D0E2FF',
          200: '#A6C8FF',
          300: '#78A9FF',
          400: '#4589FF',
          500: '#0F62FE',
          600: '#0043CE',
          700: '#002D9C',
          800: '#001D6C',
          900: '#001141',
        },
        'ibm-gray': {
          10: '#F4F4F4',
          20: '#E0E0E0',
          30: '#C6C6C6',
          40: '#A8A8A8',
          50: '#8D8D8D',
          60: '#6F6F6F',
          70: '#525252',
          80: '#393939',
          90: '#262626',
          100: '#161616',
        },
      },
    },
  },
  plugins: [],
}
