import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return { plugins: [react()], server: { proxy: {
    '/api/auth': { target: env.USERS_PROXY_TARGET || 'http://localhost:3001', changeOrigin: true },
    '/api/users': { target: env.USERS_PROXY_TARGET || 'http://localhost:3001', changeOrigin: true },
    '/api/posts': { target: env.CONTENTS_PROXY_TARGET || 'http://localhost:3002', changeOrigin: true },
    '/api/comments': { target: env.CONTENTS_PROXY_TARGET || 'http://localhost:3002', changeOrigin: true },
  } } };
});
