import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation
} from "react-router";

import type { Route } from "./+types/root";

import "~/styles/index.css";
import "~/styles/home.css";
import "~/styles/work.css";
import "~/styles/reel.css";
import "~/styles/contact.css";

import "~/components/Footer/footer.css";
import "~/components/TitleBar/title-bar.css";
import "~/components/ProjectDisplay/project-display.css";

export const pageDescription = `Maggie Lucy is an Atlanta-based cinematographer working to express her eye 
for composition, lighting, and storytelling within her work.  With a BFA in Film and Animation,
 a concentration in Cinematography, and a minor in Advertising Photography from Rochester Institute 
 of Technology.`

export function Layout({ children }: { children: React.ReactNode }) {
  const {pathname} = useLocation()
  const lightMode = false;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body style={{
        color: lightMode ? "black" : "white",
        backgroundColor: lightMode ? "white" : "black"
      }}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
