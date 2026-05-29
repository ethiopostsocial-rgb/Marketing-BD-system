import logoUrl from "@/assets/ethiopost-logo.png";

interface LogoProps {
  size?: number;
  variant?: "dark" | "light";
  showWordmark?: boolean;
}

export function EthiopostLogo({ size = 36, variant = "light", showWordmark = true }: LogoProps) {
  const textColor = variant === "light" ? "var(--sidebar-foreground)" : "var(--foreground)";
  const padded = variant === "light";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-md"
        style={{
          height: size,
          padding: padded ? 4 : 0,
          background: padded ? "rgba(255,255,255,0.96)" : "transparent",
        }}
      >
        <img
          src={logoUrl}
          alt="Ethiopost"
          style={{ height: size - (padded ? 8 : 0), width: "auto", display: "block" }}
        />
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "color-mix(in oklab, " + textColor + " 70%, transparent)" }}
          >
            M &amp; BD Platform
          </span>
          <span className="text-[13px] font-bold tracking-tight" style={{ color: textColor }}>
            Working Hub
          </span>
        </div>
      )}
    </div>
  );
}
