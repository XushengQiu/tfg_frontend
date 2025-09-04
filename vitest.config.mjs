// vitest.config.mjs (raíz del repo)
import { defineConfig } from 'vitest/config';

export default defineConfig({
    esbuild: {
        jsx: 'automatic'
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/setupTests.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            all: true,
            include: ['src/**/*.{js,jsx}'],
            exclude: [
                'src/**/*.stories.*',
                'src/**/__mocks__/**',
                'src/assets/**',
                'src/**/index.css',
                'src/App.css',
                'src/test/integration/**', // si no harás integración ahora
            ],
            thresholds: {
                global: { branches: 70, functions: 80, lines: 80, statements: 80 },
            },
        },
    },
});
