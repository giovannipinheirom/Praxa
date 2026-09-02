import { Suspense, lazy } from "react";
import { ClientOnly } from "@tanstack/react-router";

const RedeNos = lazy(() => import("./rede-nos"));

export function RedeNosFundo() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-45 [mask-image:radial-gradient(70%_60%_at_50%_45%,black,transparent)]"
    >
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <RedeNos />
        </Suspense>
      </ClientOnly>
    </div>
  );
}

/**
 * Rede 3D interativa usada no hero, sem fundo: gira conforme o mouse
 * e os nós próximos ao cursor aumentam de tamanho.
 */
export function RedeNosInterativa({ className }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Rede de prestadores conectados, animação interativa"
      className={className}
    >
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <RedeNos interativo />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
