import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { DemoProvider } from "@/contexts/DemoContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Chadminton" },
      { name: "description", content: "Badminton score tracker for Chads" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Chadminton" },
      { property: "og:description", content: "Badminton score tracker for Chads" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/IiUcwPzgIKcuR0LxKCmB1kdvSns1/social-images/social-1775286891786-Gigachad-Transparent_(1).webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/IiUcwPzgIKcuR0LxKCmB1kdvSns1/social-images/social-1775286891786-Gigachad-Transparent_(1).webp" },
      { name: "twitter:title", content: "Chadminton" },
      { name: "twitter:description", content: "Badminton score tracker for Chads" },
    ],
    links: [
      { rel: "icon", href: "/favicon.png" },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <DemoProvider>
        <RoleProvider>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
          <Toaster position="bottom-right" richColors />
        </RoleProvider>
      </DemoProvider>
    </AuthProvider>
  );
}
