// vitest.config.mjs
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
                // infra / boilerplate sin lógica
                'src/index.js',
                'src/reportWebVitals.js',
                'src/firebase.js',
                'src/services/firebase.js',
                // contenido estático (texto legal)
                'src/components/TermsContent.jsx',
                'src/components/DataPolicyContent.jsx',
                // estilos y assets
                'src/**/index.css',
                'src/App.css',
                'src/assets/**',
                // tests y mocks
                'src/test/**',
                // Son páginas "shell"
                'src/pages/Profile.jsx',
                'src/pages/Dashboard.jsx',
                // Fase sin integración: fuera de cobertura por ahora
                'src/auth-context.jsx',       // provider+firebase (0% functions)
                'src/pages/Home.js',          // estática (0% functions)
                'src/services/api.js',        // wrapper http (aquí no lo testeamos)
                'src/utils/format.js',        // hasta que metas unit tests propios
            ],
            thresholds: {
                global: { branches: 70, functions: 80, lines: 80, statements: 80 },
            },
        },
    },
});
