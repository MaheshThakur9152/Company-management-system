/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'slate-800': '#1e293b',
        'slate-500': '#64748b',
        'slate-400': '#94a3b8',
        'slate-100': '#f1f5f9',
        'purple-600': '#9333ea',
        'purple-500': '#a855f7',
        'pink-500': '#ec4899',
      },
    },
  },
  plugins: [],
}
