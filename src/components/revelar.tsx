/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";


/**
 * Scroll-reveal discreto (fade + leve slide-up).
 * Respeita prefers-reduced-motion: sem movimento, conteúdo já visível.
 */
export function Revelar({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const reduzido =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) {
      setVisivel(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisivel(true);
            obs.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Componente = Tag as any;

  return (
    <Componente
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("revelar", visivel && "revelar-visivel", className)}
    >
      {children}
    </Componente>
  );

}

/**
 * Dispara true quando o elemento entra na viewport — usado para
 * encadear o carimbo dos selos de verificação em stagger.
 */
export function useNaTela<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [naTela, setNaTela] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNaTela(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, naTela };
}
