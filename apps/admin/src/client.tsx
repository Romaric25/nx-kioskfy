import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { StartClient } from '@tanstack/react-start/client';
import { initAuth } from '@kioskfy/auth-client';
import { API_ORIGIN } from './lib/api';

// Load the Better Auth session before the first render.
initAuth({ baseURL: API_ORIGIN, basePath: '/api/auth' });

// Self-mounting client entry — the dev server imports this module
// and expects it to hydrate the app itself.
startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});
