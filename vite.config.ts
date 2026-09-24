import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ command }) => ({
  /* GitHub Pages serves from /<repo-name>/, so the production build needs that
   * base. ⚠️ It must match the GITHUB repo name exactly, case included — a
   * mismatch 404s every asset on the live site with no build error. */
  base: command === 'build' ? '/Serviceops-UI/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
}));
