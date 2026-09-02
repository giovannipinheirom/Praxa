import { useEffect, useRef, useState } from "react";

/**
 * Cursor customizado: um ponto que acompanha o mouse na hora
 * e um anel maior que segue com leve atraso (easing).
 * Desativado em telas de toque / dispositivos sem mouse fino.
 */
export function CursorSeguidor() {
  const [ativo, setAtivo] = useState(false);
  const pontoRef = useRef<HTMLDivElement | null>(null);
  const anelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;
    setAtivo(true);

    const alvo = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const anel = { ...alvo };
    let hover = false;
    let pressionado = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      alvo.x = e.clientX;
      alvo.y = e.clientY;
      const el = e.target as HTMLElement | null;
      hover = !!el?.closest?.(
        "a, button, [role='button'], input, textarea, select, label, [data-cursor='hover']",
      );
    };
    const onDown = () => (pressionado = true);
    const onUp = () => (pressionado = false);

    const loop = () => {
      anel.x += (alvo.x - anel.x) * 0.14;
      anel.y += (alvo.y - anel.y) * 0.14;

      const escala = (hover ? 1.8 : 1) * (pressionado ? 0.8 : 1);
      if (anelRef.current) {
        anelRef.current.style.transform = `translate3d(${anel.x}px, ${anel.y}px, 0) translate(-50%, -50%) scale(${escala})`;
        anelRef.current.style.opacity = hover ? "1" : "0.6";
      }
      if (pontoRef.current) {
        pontoRef.current.style.transform = `translate3d(${alvo.x}px, ${alvo.y}px, 0) translate(-50%, -50%) scale(${hover ? 0 : 1})`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  if (!ativo) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden md:block">
      <div
        ref={anelRef}
        className="absolute left-0 top-0 h-9 w-9 rounded-full border border-primary/70 bg-primary/10 backdrop-blur-[1px] transition-[opacity] duration-200 will-change-transform"
      />
      <div
        ref={pontoRef}
        className="absolute left-0 top-0 h-2 w-2 rounded-full bg-primary will-change-transform"
      />
    </div>
  );
}
