import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_app/commercial-dashboard")({
  component: CommercialDashboardPage,
});

function CommercialDashboardPage() {
  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Commercial Dashboard
          </h2>
          <p className="text-xs text-muted-foreground">
            Live commercial performance metrics
          </p>
        </div>
        <a
          href="https://lokker-vision-sync.lovable.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in new tab
        </a>
      </div>

      {/* Iframe */}
      <div className="relative flex-1">
        <iframe
          src="https://lokker-vision-sync.lovable.app/"
          title="Commercial Dashboard"
          className="absolute inset-0 h-full w-full border-0"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
