import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import path from 'node:path';

const packagesDir = path.resolve(__dirname, '../../packages');

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  resolve: {
    alias: [
      // Exact-match aliases first
      { find: '@kioskfy/ui/styles.css', replacement: path.join(packagesDir, 'ui/src/styles.css') },
      { find: '@kioskfy/types/accounting', replacement: path.join(packagesDir, 'types/src/accounting.types.ts') },
      { find: '@kioskfy/hooks/client', replacement: path.join(packagesDir, 'hooks/src/client.ts') },
      { find: '@kioskfy/hooks/auth-client', replacement: path.join(packagesDir, 'hooks/src/auth-client.ts') },
      // Prefix aliases
      { find: '@kioskfy/types', replacement: path.join(packagesDir, 'types/src/index.ts') },
      { find: '@kioskfy/api-client', replacement: path.join(packagesDir, 'api-client/src/index.ts') },
      { find: '@kioskfy/stores', replacement: path.join(packagesDir, 'stores/src/index.ts') },
      { find: '@kioskfy/hooks', replacement: path.join(packagesDir, 'hooks/src/index.ts') },
      { find: '@kioskfy/auth-client', replacement: path.join(packagesDir, 'auth-client/src/index.ts') },
      { find: '@kioskfy/ui', replacement: path.join(packagesDir, 'ui/src/index.ts') },
    ],
  },
});
