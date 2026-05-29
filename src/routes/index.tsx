import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("ethiopost-mbd-store");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.state?.currentUserId) throw redirect({ to: "/dashboard" });
        }
      } catch (e) {
        if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
      }
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
