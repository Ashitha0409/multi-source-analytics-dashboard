// When using @tailwindcss/vite plugin, Tailwind is handled by Vite directly.
// PostCSS only needs autoprefixer for vendor prefixes.
export default {
  plugins: {
    autoprefixer: {},
  },
}
