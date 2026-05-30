import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./styles.css";
import { getRouter } from "./router";

const router = getRouter();

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

// StrictMode removed — it causes double-mount which triggers double sync pulls
// and makes the app appear to lag/flash on every navigation
createRoot(rootEl).render(<RouterProvider router={router} />);
