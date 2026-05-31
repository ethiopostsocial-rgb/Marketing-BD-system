import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, useCurrentUser } from "@/lib/store";
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
  const user = useCurrentUser();
  const changePassword = useStore((s) => s.changePassword);
  const navigate = useNavigate();

  // For first-login flow (mustChangePassword) we skip asking for the current
  // password — they just proved it by logging in successfully.
  const isFirstLogin = user?.mustChangePassword ?? false;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  if (!user) return <Navigate to="/login" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Only validate current password on voluntary change (not first-login).
    if (!isFirstLogin && current !== user.password) {
      setError("Current password is incorrect.");
      return;
    }

    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!isFirstLogin && next === current) {
      setError("New password must be different from the current password.");
      return;
    }

    changePassword(user.id, next);
    toast.success("Password updated. Welcome!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <EthiopostLogo size={36} variant="dark" />
          <KeyRound className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          {isFirstLogin ? "Set a new password" : "Change password"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isFirstLogin
            ? "For security, please set a personal password before continuing. You won't be asked again."
            : "Update the password used to sign in to your Ethiopost account."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Only show current-password field on voluntary changes */}
          {!isFirstLogin && (
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="next">New password</Label>
            <Input
              id="next"
              type="password"
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-11 w-full">
            {isFirstLogin ? "Set password & continue" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
