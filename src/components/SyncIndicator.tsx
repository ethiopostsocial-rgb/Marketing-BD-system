/**
 * SyncIndicator — shown in the app header.
 * Reads sync state from SyncContext and shows a live badge.
 * Clicking it triggers an immediate force-push.
 */

import { useSyncContext } from "@/components/SyncProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Cloud, CloudOff, CloudUpload, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const { status, isOffline, lastSyncedAt, forceSync } = useSyncContext();

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const icon = (() => {
    if (isOffline) return <CloudOff className="h-3.5 w-3.5 text-amber-500" />;
    switch (status) {
      case "syncing": return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
      case "synced":  return <CloudUpload className="h-3.5 w-3.5 text-green-500" />;
      case "error":   return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      default:        return <Cloud className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  })();

  const label = (() => {
    if (isOffline) return "Offline";
    switch (status) {
      case "syncing": return "Syncing…";
      case "synced":  return "Saved";
      case "error":   return "Error";
      default:        return "Synced";
    }
  })();

  const tooltip = (() => {
    if (isOffline) return "Cannot reach server. Changes are saved locally and will sync when reconnected.";
    switch (status) {
      case "syncing": return "Pushing changes to database…";
      case "error":   return "Sync failed. Click to retry.";
      default:        return lastSyncedAt
        ? `Last synced at ${fmtTime(lastSyncedAt)}. All team members see live data. Click to force-sync.`
        : "Connected to live database. Changes sync automatically. Click to force-sync.";
    }
  })();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={forceSync}
            disabled={status === "syncing"}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
              "hover:bg-muted cursor-pointer select-none",
              status === "syncing" && "cursor-wait opacity-60",
            )}
          >
            {icon}
            <span className="hidden sm:inline text-muted-foreground">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
