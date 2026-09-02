import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/buscar/")({
  validateSearch: (search: Record<string, unknown>) => ({
    categoria: typeof search.categoria === "string" ? search.categoria : "todas",
    regiao: typeof search.regiao === "string" ? search.regiao : "todos",
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/buscar/$categoria/$regiao",
      params: {
        categoria: search.categoria || "todas",
        regiao: search.regiao || "todos",
      },
      search: { tipo: undefined },
    });
  },
});
