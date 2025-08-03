const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        popup: 'popup/popup.html'
      },
      output: {
        entryFileNames: 'popup.js',
      }
    }
  }
});
