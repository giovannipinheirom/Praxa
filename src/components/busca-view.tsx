import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Compass, SlidersHorizontal } from "lucide-react";
import { BarraBusca } from "@/components/barra-busca";
import { LinhaPrestador } from "@/components/linha-prestador";
import type { PrestadorResumo } from "@/components/prestador-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIAS,
  FAIXAS_PRECO,
  categoriaLabel,
  regiaoLabel,
  rotacionarImpulsionados,
} from "@/lib/marketplace";

const REGIOES = ["todos", "sao-paulo", "campinas", "remoto"];

export function BuscaView({
  data,
  categoria,
  regiao,
  searchParams,
}: {
  data: { prestadores: PrestadorResumo[]; totalCount: number; page: number; pageSize: number };
  categoria: string;
  regiao: string;
  searchParams: any;
}) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const navigate = useNavigate();

  const subcategoria = searchParams.subcategoria || "";
  const faixaPreco = searchParams.faixaPreco || "todas";
  const notaMinima = searchParams.notaMinima || "0";
  const tipoPrestador = searchParams.tipo || "todos";
  const ordenacao = searchParams.ordenacao || "relevancia";

  // Re-apply impulsionados rotation visually if needed (although backend is sorting)
  const resultados = useMemo(() => {
    return rotacionarImpulsionados([...data.prestadores]);
  }, [data.prestadores]);

  const chaveTransicao = `${categoria}|${regiao}|${subcategoria}|${faixaPreco}|${notaMinima}|${tipoPrestador}|${ordenacao}|${data.page}`;
  const tituloCategoria = categoria === "todas" ? "Todos os serviços" : categoriaLabel(categoria);

  const updateSearch = (newParams: Record<string, string | undefined>) => {
    navigate({
      to: "/buscar/$categoria/$regiao",
      params: { categoria, regiao },
      search: (prev: any) => ({ ...prev, ...newParams, page: 1 }), // Reset page on filter change
    });
  };
  const limparFiltros = () => {
    navigate({
      to: "/buscar/$categoria/$regiao",
      params: { categoria, regiao },
      search: { },
    });
  };

  return (
    <main className="mx-auto w-full max-w-[clamp(1024px,85vw,1440px)] px-[clamp(1rem,4vw,3rem)] py-[clamp(2rem,5vh,4rem)]">
      <nav aria-label="Trilha" className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Início
        </Link>
        <span className="px-2">/</span>
        <span className="text-foreground">
          {tituloCategoria} em {regiaoLabel(regiao)}
        </span>
      </nav>

      <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
        {tituloCategoria} em {regiaoLabel(regiao)}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Perfis abertos, sem login e sem paywall. O ranqueamento segue a reputação verificada — os
        espaços pagos aparecem sempre marcados como “Impulsionado”.
      </p>

      <div className="mt-8">
        <BarraBusca
          categoriaInicial={categoria === "todas" ? "" : tituloCategoria}
          regiaoInicial={regiao === "todos" ? "" : regiaoLabel(regiao)}
        />
      </div>

      <div className="mt-10 grid gap-[clamp(1rem,3vw,2rem)] lg:grid-cols-[clamp(200px,20vw,260px)_1fr] lg:items-start">
        <aside className="surface-panel h-fit space-y-5 p-[clamp(1rem,2vw,1.5rem)] lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFiltrosAbertos((v) => !v)}
              aria-expanded={filtrosAbertos}
              aria-controls="painel-filtros"
              className="flex min-h-11 items-center gap-2 text-sm font-semibold lg:min-h-0 lg:cursor-default"
            >
              <SlidersHorizontal className="size-4 text-primary" />
              Filtros
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform lg:hidden ${
                  filtrosAbertos ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={limparFiltros}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Limpar
            </button>
          </div>

          <div
            id="painel-filtros"
            className={`space-y-5 ${filtrosAbertos ? "block" : "hidden lg:block"}`}
          >


          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Categoria
            </Label>
            <div className="flex flex-col text-sm">
              <Link
                to="/buscar/$categoria/$regiao"
                params={{ categoria: "todas", regiao }}
                search={{ tipo: tipoPrestador !== "todos" ? tipoPrestador : undefined }}
                className={
                  categoria === "todas"
                    ? "rounded-md bg-accent px-2 py-1.5 font-medium text-accent-foreground"
                    : "rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }
              >
                Todas
              </Link>
              {CATEGORIAS.map((c) => (
                <Link
                  key={c.slug}
                  to="/buscar/$categoria/$regiao"
                  params={{ categoria: c.slug, regiao }}
                  search={{ tipo: tipoPrestador !== "todos" ? tipoPrestador : undefined }}
                  className={
                    c.slug === categoria
                      ? "rounded-md bg-accent px-2 py-1.5 font-medium text-accent-foreground"
                      : "rounded-md px-2 py-1.5 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="subcategoria"
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              Subcategoria
            </Label>
            <Input
              id="subcategoria"
              value={subcategoria}
              onChange={(e) => updateSearch({ subcategoria: e.target.value || undefined })}
              placeholder="Ex.: folha de pagamento"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Região
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {REGIOES.map((r) => (
                <Button
                  key={r}
                  asChild
                  size="sm"
                  variant={r === regiao ? "default" : "outline"}
                >
                  <Link 
                    to="/buscar/$categoria/$regiao" 
                    params={{ categoria, regiao: r }}
                    search={{ tipo: tipoPrestador !== "todos" ? tipoPrestador : undefined }}
                  >
                    {regiaoLabel(r)}
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="faixa" className="text-xs uppercase tracking-wide text-muted-foreground">
              Faixa de preço
            </Label>
            <Select value={faixaPreco} onValueChange={(val) => updateSearch({ faixaPreco: val === "todas" ? undefined : val })}>
              <SelectTrigger id="faixa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {FAIXAS_PRECO.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nota" className="text-xs uppercase tracking-wide text-muted-foreground">
              Nota mínima
            </Label>
            <Select value={notaMinima} onValueChange={(val) => updateSearch({ notaMinima: val === "0" ? undefined : val })}>
              <SelectTrigger id="nota">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Qualquer nota</SelectItem>
                <SelectItem value="3">3,0 ou mais</SelectItem>
                <SelectItem value="4">4,0 ou mais</SelectItem>
                <SelectItem value="4.5">4,5 ou mais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tipo" className="text-xs uppercase tracking-wide text-muted-foreground">
              Tipo de Prestador
            </Label>
            <Select value={tipoPrestador} onValueChange={(val) => updateSearch({ tipo: val === "todos" ? undefined : val })}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="agencia">Empresa / Agência</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
        </aside>


        <section aria-label="Resultados">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-3">
            <p aria-live="polite" className="min-w-0 truncate text-sm text-muted-foreground">
              {data.totalCount}{" "}
              {data.totalCount === 1 ? "prestador verificado" : "prestadores verificados"}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Label htmlFor="ordenacao" className="text-xs text-muted-foreground">
                Ordenar
              </Label>
              <Select value={ordenacao} onValueChange={(val) => updateSearch({ ordenacao: val === "relevancia" ? undefined : val })}>
                <SelectTrigger id="ordenacao" className="h-9 w-[140px] text-xs sm:w-[168px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevancia">Relevância</SelectItem>
                  <SelectItem value="nota">Maior nota</SelectItem>
                  <SelectItem value="resposta">Resposta mais rápida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {resultados.length > 0 ? (
            <div key={chaveTransicao} className="mt-4 animate-fade-in space-y-3">
              {resultados.map((p) => (
                <LinhaPrestador key={p.id} prestador={p} />
              ))}
              
              {data.totalCount > data.pageSize && (
                <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
                  <Button
                    variant="outline"
                    disabled={data.page <= 1}
                    onClick={() => navigate({ search: (prev: any) => ({ ...prev, page: data.page - 1 }) })}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {data.page} de {Math.ceil(data.totalCount / data.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    disabled={data.page >= Math.ceil(data.totalCount / data.pageSize)}
                    onClick={() => navigate({ search: (prev: any) => ({ ...prev, page: data.page + 1 }) })}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="surface-panel mt-4 animate-fade-in space-y-4 p-10 text-center">
              <Compass className="mx-auto size-6 text-primary" />
              <h2 className="text-lg font-semibold">
                Ainda não temos prestadores verificados nessa combinação
              </h2>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                A rede cresce toda semana. Amplie a busca para ver opções próximas ou registre sua
                demanda no pool — prestadores dessa categoria recebem o pedido e entram em contato.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild>
                  <Link to="/demandas/nova" search={{ categoria, regiao }}>
                    Registrar minha demanda
                  </Link>
                </Button>
                <Button variant="outline" onClick={limparFiltros}>
                  Ampliar a busca
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
