import { BadgeCheck, Building2, Clock, MapPin, Users, Wallet } from "lucide-react";
import { categoriaLabel, FAIXAS_PRECO, modeloTrabalhoLabel } from "@/lib/marketplace";

export type PreviewVitrineDados = {
  nome_negocio: string;
  headline?: string;
  descricao?: string;
  categoria_principal: string;
  faixa_preco: string;
  cidade?: string;
  estado?: string;
  regiao_atendimento?: string;
  foto_perfil_url?: string;
  modelo_trabalho?: string;
  total_clientes_atendidos?: string | number;
  subcategorias?: string[];
};

/** Espelha o topo da vitrine pública (/pro/slug) enquanto a pessoa preenche o cadastro. */
export function PreviewVitrine({ dados }: { dados: PreviewVitrineDados }) {
  const nome = dados.nome_negocio.trim() || "Nome do seu negócio";
  const local =
    [dados.cidade, dados.estado].filter(Boolean).join(" · ") ||
    dados.regiao_atendimento ||
    "Região de atendimento";
  const faixa =
    FAIXAS_PRECO.find((f) => f.value === dados.faixa_preco)?.label ?? dados.faixa_preco;
  const iniciais = nome.slice(0, 2).toUpperCase();
  const modo = modeloTrabalhoLabel(dados.modelo_trabalho);

  return (
    <div className="surface-panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="size-2 rounded-full bg-destructive/50" />
        <span className="size-2 rounded-full bg-muted-foreground/30" />
        <span className="size-2 rounded-full bg-primary/50" />
        <span className="ml-2 truncate font-mono text-[11px] text-muted-foreground">
          praxa.app/pro/…
        </span>
      </div>

      <div className="p-5">
        <div className="flex gap-3">
          {dados.foto_perfil_url ? (
            <img
              src={dados.foto_perfil_url}
              alt=""
              className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-border"
            />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground">
              {iniciais}
            </span>
          )}
          <div className="min-w-0">
            <span className="selo-gold inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase">
              <BadgeCheck className="size-3" aria-hidden="true" />
              verificado
            </span>
            <p className="mt-1.5 truncate text-base font-semibold">{nome}</p>
            {dados.headline?.trim() && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{dados.headline}</p>
            )}
          </div>
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {categoriaLabel(dados.categoria_principal)}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {local}
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Wallet className="size-3" />
            {faixa}
          </span>
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border px-2 py-2">
            <p className="font-mono text-sm font-semibold tabular-nums">
              {Number(dados.total_clientes_atendidos ?? 0) || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">clientes</p>
          </div>
          <div className="rounded-lg border border-border px-2 py-2">
            <p className="inline-flex items-center gap-1 text-[11px] font-medium">
              <Users className="size-3" />
              {modo ?? "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">atendimento</p>
          </div>
          <div className="rounded-lg border border-border px-2 py-2">
            <p className="inline-flex items-center gap-1 text-[11px] font-medium">
              <Clock className="size-3" />
              novo
            </p>
            <p className="text-[10px] text-muted-foreground">resposta</p>
          </div>
        </div>

        <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
          {dados.descricao?.trim() ||
            "A descrição do seu negócio aparece aqui para quem visita a vitrine."}
        </p>

        {(dados.subcategorias ?? []).length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {(dados.subcategorias ?? []).slice(0, 6).map((s) => (
              <li
                key={s}
                className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {s}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Building2 className="size-3" />
          Prévia ao vivo — é assim que sua vitrine fica publicada.
        </p>
      </div>
    </div>
  );
}
