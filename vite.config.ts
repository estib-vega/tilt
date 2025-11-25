import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    devtools(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: fileURLToPath(
        new URL('./src/ui/routes', import.meta.url),
      ),
      generatedRouteTree: fileURLToPath(
        new URL('./src/ui/routeTree.gen.ts', import.meta.url),
      ),
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/ui', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-ui',
  },
  server: {
    port: 3000,
    strictPort: true,
  },
})
