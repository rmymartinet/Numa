import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/*.test.*',
        '**/*.spec.*',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
        './src/utils/': {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        './src/components/': {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    },
  },
});
