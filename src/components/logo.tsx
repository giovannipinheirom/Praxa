import { Link } from "@tanstack/react-router";
import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "grid size-8 place-items-center rounded-lg",
          inverted ? "bg-ink-foreground text-ink" : "bg-primary text-primary-foreground",
        )}
      >
        <Hexagon className="size-4" strokeWidth={2.4} />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">Praxa</span>
    </Link>
  );
}
