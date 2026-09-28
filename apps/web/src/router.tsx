import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { Button, NotFoundPage } from '@kioskfy/ui';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultNotFoundComponent: () => (
      <NotFoundPage>
        <Button variant="outline" size="lg" asChild>
          <a href="/support">Contacter le support</a>
        </Button>
      </NotFoundPage>
    ),
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
