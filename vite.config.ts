import type { UserConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { vitePrerenderPlugin } from "vite-prerender-plugin";
import * as path from "node:path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  let build: UserConfig['build'], esbuild: UserConfig['esbuild'], define: UserConfig['define']

  if (mode === 'development') {
    build = {
      minify: false,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    }

    esbuild = {
      jsxDev: true,
      keepNames: true,
      minifyIdentifiers: false,
    }

    define = {
      'process.env.NODE_ENV': '"development"',
      '__DEV__': 'true',
    }
  }

  return {
    plugins: [
      react(),
      vitePrerenderPlugin({
        renderTarget: '#root',
        prerenderScript: path.resolve(__dirname, 'src/prerender.tsx'),
      }),
    ],
    build: mode === 'development' ? build : {
      // Production optimizations
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            'vendor': ['react', 'react-dom', 'framer-motion'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    esbuild: mode === 'development' ? esbuild : {
      // Remove console.log in production (keep error/warn)
      drop: ['debugger'],
      pure: ['console.log'],
    },
    define,
    resolve: {
      alias: {
        '@': '/src',
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  }
})
