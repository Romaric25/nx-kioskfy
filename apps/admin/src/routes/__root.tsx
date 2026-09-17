import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { ThemeProvider } from '@kioskfy/ui';
import appCss from '../styles.css?inline';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Kioskfy — Admin' },
    ],
    scripts: [
      {
        // Applique le thème avant le premier render (évite le flash)
        children: `(function(){var d=document.documentElement;var t=localStorage.getItem('theme')||'system';var r=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light';d.classList.toggle('dark',r==='dark');d.style.colorScheme=r})()`,
      },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* CSS inliné : style disponible dès le premier paint, sans requête ni flash */}
        <style dangerouslySetInnerHTML={{ __html: appCss }} />
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
