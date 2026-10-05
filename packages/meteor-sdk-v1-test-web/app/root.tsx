import "~/core/meteor-wallet/polyfill_web_node_modules";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { MeteorLogger, setEnvConfig } from "@meteorwallet/sdk";
import { DEPLOYMENT } from "~/core/deployment";
import { Button } from "~/ui/Button";

const envVars = {
  ...process.env,
};

console.log("environemnt variables", envVars);

console.log(process.env["NODE_ENV"]);
console.log(envVars["NODE_ENV"]);

if (process.env.NODE_ENV === "development") {
  console.log("Setting MeteorLogger global logging level to debug for development environment");
  MeteorLogger.setGlobalLoggingLevel("debug");
}

// V1 web wallet popups follow the deployment kind, unless the SDK's own localStorage override is set.
if (
  typeof window === "undefined" ||
  window.localStorage.getItem("DEV__METEOR_WALLET_BASE_URL") == null
) {
  setEnvConfig({ wallet_base_url: DEPLOYMENT.webWalletUrl });
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div>
      <div className={"flex justify-start justify-items-start items-start gap-5 p-5"}>
        {/* <Button
          active={location.pathname === "/"}
          onClick={() => {
            navigate("/");
          }}
        >
          Meteor Native SDK / Wallet Selector
        </Button> */}
        <Button
          active={location.pathname === "/near-connect"}
          onClick={() => {
            navigate("/near-connect");
          }}
        >
          NEAR Connect
        </Button>
        <Button
          active={location.pathname === "/"}
          onClick={() => {
            navigate("/");
          }}
        >
          Meteor Connect
        </Button>
        <span
          className={`ml-auto self-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
            DEPLOYMENT.kind === "production"
              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          }`}
          title={`Bridge backend: ${DEPLOYMENT.bridgeBackend} · Web wallet: ${DEPLOYMENT.webWalletUrl} · Mobile: ${DEPLOYMENT.mobileAppId}`}
        >
          {DEPLOYMENT.kind} deployment
        </span>
      </div>
      <Outlet />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env?.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>

      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
