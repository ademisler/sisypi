const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: false, // Disable minification to see what's happening
    rollupOptions: {
      input: {
        popup: 'popup.html',
      },
      output: {
        entryFileNames: 'popup.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      treeshake: false, // Disable tree-shaking
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  server: {
    port: 3000,
    open: false,
  },
});
