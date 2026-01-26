import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  // Base path for GitHub Pages deployment
  const basePath = env.BASE_PATH || '/claude-flow';

  return {
    plugins: [react()],

    // Base path for GitHub Pages
    base: mode === 'production' ? basePath : '/',

    // Resolve aliases for cleaner imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@store': path.resolve(__dirname, './src/store'),
        '@data': path.resolve(__dirname, './src/data'),
        '@types': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },

    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',

      // Rollup options for code splitting
      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal caching
          manualChunks: {
            // React and related libraries
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // D3 visualization library
            'vendor-d3': ['d3', 'd3-force'],
            // Animation libraries
            'vendor-animation': ['framer-motion'],
            // State management
            'vendor-state': ['zustand'],
          },
          // Asset naming with hash for cache busting
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').pop() || '';
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/woff2?|ttf|eot/i.test(extType)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },

      // Minification settings
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },

      // Performance settings
      target: 'esnext',
      cssTarget: 'chrome100',

      // Chunk size warning limit (400KB)
      chunkSizeWarningLimit: 400,
    },

    // Development server configuration
    server: {
      port: 3000,
      host: true,
      open: true,
      cors: true,
    },

    // Preview server configuration (for testing production build)
    preview: {
      port: 4173,
      host: true,
    },

    // CSS configuration
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: 'camelCase',
      },
    },

    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'd3', 'd3-force', 'framer-motion', 'zustand'],
      exclude: [],
    },

    // Environment variable prefix
    envPrefix: ['VITE_', 'BASE_'],

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  };
});
