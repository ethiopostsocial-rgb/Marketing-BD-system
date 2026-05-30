import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { EthiopostLogo } from "@/components/EthiopostLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { loadState } from "@/lib/sync.client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const BANNER_ITEMS = [
  "Plan campaigns", "Track KPIs in real time", "Approve subordinate work",
  "Run daily check-ups", "Broadcast announcements", "Manage cross-functional tasks",
  "Distribute marketing materials", "Monitor district inventory",
  "Compare Marketing vs BD", "Secure role-based access",
];

function Marquee({ reverse = false }: { reverse?: boolean }) {
  const items = [...BANNER_ITEMS, ...BANNER_ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-card/60 py-2.5 backdrop-blur">
      <div
        className={`flex w-max gap-10 ${reverse ? "animate-marquee-slow" : "animate-marquee"}`}
        style={{ flexDirection: reverse ? "row-reverse" : "row" }}
      >
        {items.map((t, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-medium text-foreground/80">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoginPage() {
  const login        = useStore((s) => s.login);
  const currentUserId = useStore((s) => s.currentUserId);
  const navigate     = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  if (currentUserId) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Always pull latest state from GitHub before logging in
      // This ensures password changes and mustChangePassword flag are up to date
      const result = await loadState();
      if (result?.state) {
        useStore.setState(result.state as Parameters<typeof useStore.setState>[0], false);
      }
    } catch {
      // Network error — fall back to local state silently
    }

    const u = login(email, password);
    setLoading(false);

    if (!u) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    toast.success(`Welcome, ${u.name.split(" ")[0]}`);

    // Only redirect to change-password if mustChangePassword is still true
    // after pulling the latest state from GitHub
    if (u.mustChangePassword) {
      navigate({ to: "/change-password" });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <div className="grid flex-1 lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
          style={{ background: "linear-gradient(160deg, var(--sidebar), color-mix(in oklab, var(--primary) 50%, black))" }}>
          <div className="relative z-10">
            <EthiopostLogo size={44} />
          </div>
          <div className="relative z-10 max-w-md text-sidebar-foreground">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Marketing &amp; Business Development Working Platform
            </h1>
            <p className="mt-4 text-base text-sidebar-foreground/70">
              Hierarchical performance tracking, cross-functional task management, routine operational check-ups, and marketing inventory distribution — purpose-built for Ethiopost.
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-lg border border-sidebar-border/40 bg-white/5 p-4 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <div className="text-sm">
                <div className="font-medium text-sidebar-foreground">Role-based access control</div>
                <div className="text-sidebar-foreground/60">Every view is scoped to your unit and subordinates.</div>
              </div>
            </div>
          </div>
          <div className="relative z-10 text-xs text-sidebar-foreground/40">
            © {new Date().getFullYear()} Ethiopian Postal Service Enterprise
          </div>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }} />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }} />
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <div className="lg:hidden"><EthiopostLogo size={36} variant="dark" /></div>
          <div className="mx-auto w-full max-w-md">
            <h2 className="mt-8 text-2xl font-bold text-foreground lg:mt-0">Sign in to your account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use your Ethiopost work credentials.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" type="email" autoComplete="email" required
                  placeholder="name@ethiopost.et"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </span>
                ) : "Sign in"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Trouble signing in? Contact your unit administrator.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-auto">
        <Marquee />
        <Marquee reverse />
        <div className="border-t border-border bg-background/80 px-6 py-3 text-center text-[11px] text-muted-foreground">
          Internal use only · Marketing &amp; Business Development · Ethiopian Postal Service Enterprise
        </div>
      </footer>
    </div>
  );
}
