import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { prismaApiPlugin } from './src/server/prismaPlugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prismaApiPlugin()],
});
