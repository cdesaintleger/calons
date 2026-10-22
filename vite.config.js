import { defineConfig } from 'vite';

// Relative assets locally; GitHub Actions supplies the repository subdirectory.
export default defineConfig({ base: process.env.VITE_BASE_PATH || './' });
