import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import path from 'node:path';

const packagesDir = path.resolve(__dirname, '../../packages');

export default defineConfig({
  plugins: [
    tailwindcss(),
    // tanstackStart bundles the TanStack Router plugin (route generation + HMR)
    tanstackStart(),
    // React Refresh runtime - required by TanStack Start dev mode
    viteReact(),
  ],
  resolve: {
    alias: [
      // Exact-match aliases first
      { find: '@kioskfy/ui/styles.css', replacement: path.join(packagesDir, 'ui/src/styles.css') },
      // Prefix aliases
      { find: '@kioskfy/types', replacement: path.join(packagesDir, 'types/src/index.ts') },
      { find: '@kioskfy/api-client', replacement: path.join(packagesDir, 'api-client/src/index.ts') },
      { find: '@kioskfy/ui', replacement: path.join(packagesDir, 'ui/src/index.ts') },
      { find: '@', replacement: path.join(__dirname, 'src') },
    ],
  },
  // Production : derrière le reverse-proxy (Coolify/Traefik), le Host header
  // est un domaine wildcard (sslip.io...) — on autorise tous les hosts.
  preview: {
    allowedHosts: true,
  },
});
