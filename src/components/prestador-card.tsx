import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Sparkles, Star, Users } from "lucide-react";
import { categoriaLabel } from "@/lib/marketplace";

export type PrestadorResumo = {
  id: string;
  slug: string;
  nome_negocio: string;
  categoria_principal: string;
  subcategorias: string[] | null;
  descricao: string | null;
  headline?: string | null;
  regiao_atendimento: string | null;
  cidade: string | null;
  estado: string | null;
  foto_perfil_url: string | null;
  nota_media: number;
  total_avaliacoes: number;
  total_clientes_atendidos: number;
  tempo_medio_resposta_horas: number | null;
  faixa_preco: string;
  impulsionado?: boolean;
  tipo_prestador?: "freelancer" | "agencia";
};

export function Iniciais({ nome }: { nome: string }) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-accent text-base font-semibold text-accent-foreground">
      {iniciais || "P"}
    </span>
  );
}

export function PrestadorCard({ prestador }: { prestador: PrestadorResumo }) {
  const local =
    [prestador.cidade, prestador.estado].filter(Boolean).join(" · ") ||
    prestador.regiao_atendimento ||
    "Atende remoto";

  return (
    <article
      className={
        prestador.impulsionado
          ? "group relative flex flex-col gap-6 rounded-[2rem] border-2 border-dashed border-primary/30 bg-primary/[0.02] p-6 sm:p-8 transition-all hover:border-primary/50 hover:shadow-elevated md:flex-row"
          : "group flex flex-col gap-6 rounded-[2rem] border border-border/60 bg-white p-6 sm:p-8 transition-all hover:border-primary/20 hover:shadow-elevated md:flex-row"
      }
    >
      {prestador.impulsionado && (
        <span className="absolute left-6 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
          <Sparkles className="size-3" />
          Impulsionado · anúncio pago
        </span>
      )}

      {prestador.foto_perfil_url ? (
        <img
          src={prestador.foto_perfil_url}
          alt={`Logo de ${prestador.nome_negocio}`}
          className="size-14 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <Iniciais nome={prestador.nome_negocio} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">
            <Link
              to="/pro/$slug"
              params={{ slug: prestador.slug }}
              className="hover:text-primary"
            >
              {prestador.nome_negocio}
            </Link>
          </h3>
          {prestador.tipo_prestador === "freelancer" && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
              Freelancer
            </span>
          )}
          {prestador.impulsionado && (
            <span className="text-[11px] text-muted-foreground">
              exibido por rotação entre elegíveis
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {categoriaLabel(prestador.categoria_principal)} · {local}
        </p>

        {(prestador.headline || prestador.descricao) && (
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
            {prestador.headline || prestador.descricao}
          </p>
        )}

        {(prestador.subcategorias ?? []).length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {(prestador.subcategorias ?? []).slice(0, 4).map((sub) => (
              <li
                key={sub}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
              >
                {sub}
              </li>
            ))}
          </ul>
        )}

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Nota média</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-medium">
              <Star className="size-3.5 text-primary" />
              {Number(prestador.nota_media).toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground">
                ({prestador.total_avaliacoes})
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Clientes</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-medium">
              <Users className="size-3.5 text-primary" />
              {prestador.total_clientes_atendidos}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Resposta</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-medium">
              <Clock className="size-3.5 text-primary" />
              {prestador.tempo_medio_resposta_horas
                ? `${Number(prestador.tempo_medio_resposta_horas).toFixed(0)}h`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Faixa</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-medium">
              <MapPin className="size-3.5 text-primary" />
              {prestador.faixa_preco}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
