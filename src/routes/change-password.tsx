import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, useCurrentUser } from "@/lib/store";
import { useSyncContext } from "@/components/SyncProvider";
import { EthiopostLogo } from "@/components/EthiopostLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

export const Route = createFileRoute("/change-password")({
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const user           = useCurrentUser();
  const changePassword = useStore((s) => s.changePassword);
  const navigate       = useNavigate();
  const { forceSync }  = useSyncContext();

  const isFirstLogin = user?.mustChangePassword ?? false;

  const [current, setCurrent] = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [error,   setError]   = useState("");

  // Not logged in
  if (!user) return <Navigate to="/login" />;

  // Already changed password and visiting this page directly — redirect away
  if (!isFirstLogin) return <Navigate to="/dashboard" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (next.trim().length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    // Save new password + set mustChangePassword = false in store + push to GitHub
    changePassword(user.id, next);
    forceSync();
    toast.success("Password set! Welcome to Ethiopost.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <EthiopostLogo size={36} variant="dark" />
          <KeyRound className="h-5 w-5 text-muted-foreground" />
        </div>

        <h1 className="text-xl font-bold text-foreground">Set your personal password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This is a one-time step. After this, sign in with your email and this new password. You will not be asked again.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="next">New password</Label>
            <Input
              id="next" type="password" autoComplete="new-password" required
              placeholder="At least 8 characters"
              value={next} onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm" type="password" autoComplete="new-password" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full">
            Set password &amp; continue
          </Button>
        </form>
      </div>
    </div>
  );
}
