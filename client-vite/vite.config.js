import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Set root to client-vite directory
  root: resolve(__dirname), 
  // Base public path (adjust if deploying to subdirectory)
  base: '/', 
  build: {
    // Output directory relative to root - Changed to server/public
    outDir: resolve(__dirname, '../server/public'), 
    // Empty output directory before build
    emptyOutDir: true, 
    rollupOptions: {
      input: {
        // Define entry points for each HTML page
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'), // Added login
        register: resolve(__dirname, 'register.html'), // Added register
        chat: resolve(__dirname, 'chat.html'),
        docs: resolve(__dirname, 'docs/index.html'),
        editor: resolve(__dirname, 'docs/editor.html'),
      },
    },
  },
  server: {
    // Port for Vite dev server (optional, defaults to 5173)
    // port: 5173, 
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://127.0.0.1:3000', // Changed to IP address
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,      // If backend is not https
        // rewrite: (path) => path.replace(/^\/api/, ''), // Uncomment if backend doesn't expect /api prefix
      },
      // Proxy auth requests if they don't start with /api
       '/auth': {
         target: 'http://127.0.0.1:3000', // Changed to IP address
         changeOrigin: true,
         secure: false,
       },
    },
  },
  // Ensure 'public' directory is correctly configured (usually default)
  publicDir: resolve(__dirname, 'public'), 
});
