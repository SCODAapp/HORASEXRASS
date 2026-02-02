import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    base: '/HORASEXRASS/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
    },
    server: {
        port: 5173,
        host: true
    },
    optimizeDeps: {
        exclude: ['lucide-react']
    }
});
