import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML for web. Adds theme-color, PWA manifest, and iOS "Add to Home Screen" meta.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#06040A" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Shhh" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #06040A;
            padding-top: env(safe-area-inset-top, 0);
            overflow: hidden;
          }
          /* Premium scrollbar — thin, dark, invisible until hover */
          * { scrollbar-width: thin; scrollbar-color: rgba(124,43,255,0.15) transparent; }
          *::-webkit-scrollbar { width: 6px; height: 6px; }
          *::-webkit-scrollbar-track { background: transparent; }
          *::-webkit-scrollbar-thumb { background: rgba(124,43,255,0.15); border-radius: 3px; }
          *::-webkit-scrollbar-thumb:hover { background: rgba(124,43,255,0.3); }
          *::-webkit-scrollbar-corner { background: transparent; }
          /* Hide scrollbar on mobile/touch */
          @media (pointer: coarse) {
            * { scrollbar-width: none; }
            *::-webkit-scrollbar { display: none; }
          }
          /* Smooth font rendering */
          body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          /* Prevent text selection on UI elements */
          [role="button"], [role="tab"], [role="navigation"] { -webkit-user-select: none; user-select: none; }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
