import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { BuscaView } from "@/components/busca-view";
import type { PrestadorResumo } from "@/components/prestador-card";
import { buscarPrestadores } from "@/lib/marketplace.functions";
import { categoriaLabel, regiaoLabel } from "@/lib/marketplace";

const buscaQuery = (categoria: string, regiao: string, search: Record<string, any> = {}) =>
  queryOptions({
    queryKey: ["busca-prestadores", categoria, regiao, search],
    queryFn: () =>
      buscarPrestadores({
        data: {
          categoria: categoria === "todas" ? undefined : categoria,
          regiao: regiao === "todos" ? undefined : regiao,
          tipoPrestador: search.tipo,
          subcategoria: search.subcategoria,
          faixaPreco: search.faixaPreco,
          notaMinima: search.notaMinima ? Number(search.notaMinima) : undefined,
          ordenacao: search.ordenacao,
          page: search.page ? Number(search.page) : 1,
        },
      }),
  });

export const Route = createFileRoute("/buscar/$categoria/$regiao")({
  validateSearch: (search: Record<string, unknown>) => ({
    tipo: (search.tipo as string) || undefined,
    subcategoria: (search.subcategoria as string) || undefined,
    faixaPreco: (search.faixaPreco as string) || undefined,
    notaMinima: (search.notaMinima as string) || undefined,
    ordenacao: (search.ordenacao as string) || undefined,
    page: search.page ? Number(search.page) : 1,
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, params, deps }) => {
    context.queryClient.ensureQueryData(buscaQuery(params.categoria, params.regiao, deps.search));
  },
  head: ({ params }) => {
    const titulo = `${
      params.categoria === "todas" ? "Prestadores de serviço" : categoriaLabel(params.categoria)
    } em ${regiaoLabel(params.regiao)} | Praxa`;
    const descricao = `Compare prestadores de ${
      params.categoria === "todas" ? "serviços B2B" : categoriaLabel(params.categoria).toLowerCase()
    } em ${regiaoLabel(
      params.regiao,
    )} por nota média, avaliações verificadas, tempo de resposta e faixa de preço.`;
    const url = `/buscar/${params.categoria}/${params.regiao}`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Não foi possível carregar os resultados</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tente novamente em instantes.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
      <h1 className="text-xl font-semibold">Busca não encontrada</h1>
    </div>
  ),
  component: BuscarCategoriaRegiao,
});

function BuscarCategoriaRegiao() {
  const { categoria, regiao } = Route.useParams();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(buscaQuery(categoria, regiao, search));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <BuscaView
        data={data as any}
        categoria={categoria}
        regiao={regiao}
        searchParams={search}
      />
    </div>
  );
}
