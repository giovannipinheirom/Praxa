import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/site-header";
import { FormAvaliacao } from "@/components/form-avaliacao";
import { obterConvite } from "@/lib/avaliacoes.functions";

export const Route = createFileRoute("/avaliar/$token")({
  head: () => ({
    meta: [
      { title: "Avaliar prestador | Praxa" },
      {
        name: "description",
        content: "Convite de uso único para registrar uma avaliação verificada na Praxa.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Avaliar prestador | Praxa" },
      {
        property: "og:description",
        content: "Convite de uso único para registrar uma avaliação verificada na Praxa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AvaliarPorConvite,
});

function AvaliarPorConvite() {
  const { token } = Route.useParams();
  const buscar = useServerFn(obterConvite);

  const { data, isLoading } = useQuery({
    queryKey: ["convite", token],
    queryFn: () => buscar({ data: { token } }),
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-14">
        {isLoading && <p className="text-sm text-muted-foreground">Validando convite…</p>}

        {!isLoading && (!data || !data.valido) && (
          <div className="surface-panel space-y-2 p-8">
            <h1 className="text-xl font-semibold">Convite indisponível</h1>
            <p className="text-sm text-muted-foreground">
              Este convite não existe, já foi usado ou expirou. Cada convite vale para uma única
              avaliação — peça um novo link ao prestador.
            </p>
          </div>
        )}

        {!isLoading && data?.valido && (
          <>
            <h1 className="text-2xl font-semibold">
              {data.clienteNome ? `Olá, ${data.clienteNome}!` : "Sua opinião conta"}
            </h1>
            <p className="mt-2 mb-8 text-muted-foreground">
              Você foi convidado por {data.prestadorNome} para registrar uma avaliação verificada.
            </p>
            <FormAvaliacao
              prestadorSlug={data.prestadorSlug}
              prestadorNome={data.prestadorNome}
              token={token}
            />
          </>
        )}
      </main>
    </div>
  );
}
