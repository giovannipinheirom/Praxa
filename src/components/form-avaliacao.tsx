import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Building2,
  Check,
  Mail,
  ShieldCheck,
  Star,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { enviarAvaliacao } from "@/lib/avaliacoes.functions";

type Metodo = "cnpj" | "email" | "convite";

type Props = {
  prestadorSlug: string;
  prestadorNome: string;
  token?: string;
  onEnviada?: () => void;
};

const METODOS: {
  id: Metodo;
  titulo: string;
  descricao: string;
  icone: typeof Building2;
}[] = [
  {
    id: "cnpj",
    titulo: "CNPJ da minha empresa",
    descricao: "Validamos o número em tempo real. Nada é publicado no perfil.",
    icone: Building2,
  },
  {
    id: "email",
    titulo: "E-mail corporativo",
    descricao: "Domínio próprio da empresa. Domínios gratuitos não são aceitos.",
    icone: Mail,
  },
  {
    id: "convite",
    titulo: "Convite do prestador",
    descricao: "Link de uso único enviado a você depois do serviço.",
    icone: Ticket,
  },
];

/**
 * Fluxo de avaliação verificada (lado do cliente).
 * Passo 1: método de verificação. Passo 2: nota e comentário.
 * Confirmação usa o carimbo cerimonial — um dos quatro momentos oficiais.
 */
export function FormAvaliacao({ prestadorSlug, prestadorNome, token, onEnviada }: Props) {
  const enviar = useServerFn(enviarAvaliacao);
  const [passo, setPasso] = useState<0 | 1>(token ? 1 : 0);
  const [metodo, setMetodo] = useState<Metodo | null>(token ? "convite" : null);
  const [nota, setNota] = useState(5);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [email, setEmail] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [tokenManual, setTokenManual] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);

  if (enviada) {
    return (
      <ConfirmacaoCarimbo prestadorNome={prestadorNome} metodo={metodo ?? "convite"} nota={nota} />
    );
  }

  const credencialOk =
    metodo === "cnpj"
      ? cnpj.replace(/\D/g, "").length === 14
      : metodo === "email"
        ? /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim())
        : Boolean(token || tokenManual.trim().length >= 10);

  return (
    <div className="surface-panel overflow-hidden">
      <header className="border-b border-border/60 px-6 py-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          <ShieldCheck className="size-3.5 text-gold-ink" />
          Avaliação verificada
        </div>
        <h3 className="mt-2 text-lg font-semibold">Avaliar {prestadorNome}</h3>
        <div className="mt-4 flex items-center gap-2">
          {[0, 1].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= passo ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      </header>

      {passo === 0 && (
        <div className="animate-fade-in space-y-5 p-6">
          <div className="rounded-lg border border-border/60 bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Por que pedimos verificação?</strong> Isso garante
              que as notas aqui vêm de clientes reais — é o que dá peso à sua avaliação e o que
              impede notas compradas.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Como podemos comprovar seu vínculo?</Label>
            {METODOS.map((m) => {
              const Icone = m.icone;
              const ativo = metodo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodo(m.id)}
                  aria-pressed={ativo}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-all",
                    ativo
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 rounded-md p-2 transition-colors",
                      ativo ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    <Icone className="size-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{m.titulo}</span>
                    <span className="block text-xs text-muted-foreground">{m.descricao}</span>
                  </span>
                  {ativo && <Check className="mt-1 size-4 text-primary" />}
                </button>
              );
            })}
          </div>

          {metodo === "cnpj" && (
            <div className="animate-fade-in space-y-2">
              <Label htmlFor="cnpj">CNPJ da sua empresa</Label>
              <Input
                id="cnpj"
                maxLength={18}
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          )}

          {metodo === "email" && (
            <div className="animate-fade-in space-y-2">
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@suaempresa.com.br"
              />
            </div>
          )}

          {metodo === "convite" && !token && (
            <div className="animate-fade-in space-y-2">
              <Label htmlFor="token">Código do convite</Label>
              <Input
                id="token"
                maxLength={120}
                value={tokenManual}
                onChange={(e) => setTokenManual(e.target.value)}
                placeholder="Cole aqui o código recebido do prestador"
              />
              <p className="text-xs text-muted-foreground">
                O convite está no link enviado pelo prestador, depois de <code>/avaliar/</code>.
              </p>
            </div>
          )}

          <Button
            type="button"
            disabled={!metodo || !credencialOk}
            onClick={() => setPasso(1)}
            className="w-full sm:w-auto"
          >
            Continuar
          </Button>
        </div>
      )}

      {passo === 1 && (
        <form
          className="animate-fade-in space-y-6 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setEnviando(true);
            try {
              const r = await enviar({
                data: {
                  prestadorSlug,
                  nota,
                  comentario,
                  email: metodo === "email" ? email : "",
                  cnpj: metodo === "cnpj" ? cnpj : "",
                  token: metodo === "convite" ? (token ?? tokenManual.trim()) : "",
                },
              });
              if (r.ok) {
                setEnviada(true);
                onEnviada?.();
              } else {
                toast.error(r.erro);
              }
            } catch {
              toast.error("Revise os campos e tente novamente.");
            } finally {
              setEnviando(false);
            }
          }}
        >
          <div className="space-y-3">
            <Label>Sua nota</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1" onMouseLeave={() => setNotaHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Nota ${n}`}
                    onMouseEnter={() => setNotaHover(n)}
                    onClick={() => setNota(n)}
                    className="rounded p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "size-7 transition-colors",
                        n <= (notaHover || nota)
                          ? "fill-gold text-gold-ink"
                          : "text-muted-foreground/50",
                      )}
                    />
                  </button>
                ))}
              </div>
              <span className="font-mono text-2xl font-semibold tabular-nums">
                {(notaHover || nota).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentario">Sua experiência</Label>
            <Textarea
              id="comentario"
              required
              rows={5}
              minLength={20}
              maxLength={2000}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Conte o que foi contratado, prazo e resultado (mínimo 20 caracteres)."
            />
            <p className="text-xs text-muted-foreground">
              {comentario.trim().length < 20
                ? `Faltam ${20 - comentario.trim().length} caracteres`
                : `${comentario.length}/2000`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!token && (
              <Button type="button" variant="ghost" onClick={() => setPasso(0)}>
                <ArrowLeft className="size-4" />
                Voltar
              </Button>
            )}
            <Button type="submit" disabled={enviando || comentario.trim().length < 20}>
              {enviando ? "Verificando…" : "Enviar avaliação verificada"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

const ROTULO_METODO: Record<Metodo, string> = {
  cnpj: "CNPJ validado",
  email: "E-mail corporativo",
  convite: "Convite do prestador",
};

/**
 * Momento cerimonial: a opinião vira dado verificado.
 * Carimbo em destaque — uso oficial autorizado da animação stamp-in.
 */
function ConfirmacaoCarimbo({
  prestadorNome,
  metodo,
  nota,
}: {
  prestadorNome: string;
  metodo: Metodo;
  nota: number;
}) {
  const [fase, setFase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setFase(1), 120);
    const t2 = setTimeout(() => setFase(2), 780);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="surface-panel relative overflow-hidden px-6 py-12 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,var(--color-gold-soft),transparent_65%)] opacity-40"
      />
      <div className="relative">
        <div className="flex justify-center">
          <div
            className={cn(
              "selo-gold flex size-28 flex-col items-center justify-center rounded-full",
              fase >= 1 ? "animate-stamp-in" : "opacity-0",
            )}
          >
            <ShieldCheck className="size-8" />
            <span className="mt-1 text-[9px] font-bold tracking-widest uppercase">Verificada</span>
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-500",
            fase >= 2 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          <h3 className="mt-8 text-2xl font-semibold">Sua avaliação agora é um dado verificado</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            A nota <strong className="font-mono text-foreground">{nota.toFixed(1)}</strong> que você
            deu a {prestadorNome} entra no perfil com peso de cliente comprovado — e passa a
            influenciar a reputação dele na Praxa.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 font-medium">
              <Check className="size-3.5 text-primary" />
              {ROTULO_METODO[metodo]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 font-medium">
              <Check className="size-3.5 text-primary" />
              Vínculo com cliente real
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
