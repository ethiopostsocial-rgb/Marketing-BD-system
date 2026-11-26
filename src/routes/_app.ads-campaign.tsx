import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser, canAccessTab } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, Target } from "lucide-react";

const CAMPAIGN_URL = "https://ethiopost-marketing.vercel.app";

export const Route = createFileRoute("/_app/ads-campaign")({
  component: AdsCampaignPage,
});

function AdsCampaignPage() {
  const user = useCurrentUser();

  if (!user) return null;
  if (!canAccessTab(user, "ads_campaign")) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-8">
            <Shield className="h-6 w-6 text-muted-foreground" />
            <div>
              <h2 className="text-lg font-semibold">Restricted</h2>
              <p className="text-sm text-muted-foreground">Your account does not have access to the Ads / Campaign workspace.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-4 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Ads / Campaign Workspace</h2>
            <p className="text-sm text-muted-foreground">Plan, launch and monitor advertising and campaign activity.</p>
          </div>
        </div>
        <Button asChild className="gap-2">
          <a href={CAMPAIGN_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </a>
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden">
        <CardContent className="h-full p-0">
          <iframe
            title="Ads / Campaign workspace"
            src={CAMPAIGN_URL}
            className="h-full w-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        If the workspace does not appear above, the site does not allow embedding. Use "Open in new tab" instead.
      </p>
    </div>
  );
}
