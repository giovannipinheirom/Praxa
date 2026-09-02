import { PainelHeader } from "@/components/painel/painel-header";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePrestador } from "@/hooks/use-prestador";
import {
  CATEGORIAS,
  FAIXAS_PRECO,
  MODELOS_PRECIFICACAO,
  MODELOS_TRABALHO,
  TAMANHOS_EQUIPE,
} from "@/lib/marketplace";
import { PreviewVitrine } from "@/components/preview-vitrine";

export const Route = createFileRoute("/_authenticated/painel/perfil")({
  head: () => ({
    meta: [
      { title: "Gestão do perfil público | Praxa" },
      { name: "description", content: "Edite descrição, foto e especialidades da sua vitrine." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PerfilPublico,
});

function PerfilPublico() {
  const { data, isLoading } = usePrestador();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    nome_negocio: "",
    descricao: "",
    subcategorias: "",
    regiao_atendimento: "",
    cidade: "",
    estado: "",
    faixa_preco: "$$",
    categoria_principal: "contabilidade",
    foto_perfil_url: "",
    total_clientes_atendidos: "0",
    headline: "",
    ano_fundacao: "",
    tamanho_equipe: "",
    modelo_trabalho: "remoto",
    modelo_precificacao: "projeto",
    email_contato: "",
    whatsapp: "",
    site_url: "",
    linkedin_url: "",
    instagram_url: "",
    tipo_prestador: "agencia" as "agencia" | "freelancer",
    portfolio: [] as any[],
    equipe: [] as any[],
    perguntas_frequentes: [] as any[],
  });

  useEffect(() => {
    if (!data) return;
    const p = data.prestador;
    setForm({
      nome_negocio: p.nome_negocio ?? "",
      descricao: p.descricao ?? "",
      subcategorias: (p.subcategorias ?? []).join(", "),
      regiao_atendimento: p.regiao_atendimento ?? "",
      cidade: p.cidade ?? "",
      estado: p.estado ?? "",
      faixa_preco: p.faixa_preco ?? "$$",
      categoria_principal: p.categoria_principal ?? "contabilidade",
      foto_perfil_url: p.foto_perfil_url ?? "",
      total_clientes_atendidos: String(p.total_clientes_atendidos ?? 0),
      headline: p.headline ?? "",
      ano_fundacao: p.ano_fundacao ? String(p.ano_fundacao) : "",
      tamanho_equipe: p.tamanho_equipe ?? "",
      modelo_trabalho: p.modelo_trabalho ?? "remoto",
      modelo_precificacao: p.modelo_precificacao ?? "projeto",
      email_contato: p.email_contato ?? "",
      whatsapp: p.whatsapp ?? "",
      site_url: p.site_url ?? "",
      linkedin_url: p.linkedin_url ?? "",
      instagram_url: p.instagram_url ?? "",
      tipo_prestador: (p as any).tipo_prestador ?? "agencia",
      portfolio: (p as any).portfolio ?? [],
      equipe: (p as any).equipe ?? [],
      perguntas_frequentes: (p as any).perguntas_frequentes ?? [],
    });
  }, [data]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error("sem prestador");
      const { error } = await supabase
        .from("prestadores")
        .update({
          nome_negocio: form.nome_negocio.trim(),
          descricao: form.descricao.trim(),
          subcategorias: form.subcategorias
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          regiao_atendimento: form.regiao_atendimento.trim(),
          cidade: form.cidade.trim() || null,
          estado: form.estado.trim() || null,
          faixa_preco: form.faixa_preco as never,
          categoria_principal: form.categoria_principal as never,
          foto_perfil_url: form.foto_perfil_url.trim() || null,
          total_clientes_atendidos: Number(form.total_clientes_atendidos) || 0,
          headline: form.headline.trim() || null,
          ano_fundacao: form.ano_fundacao.trim() ? Number(form.ano_fundacao) : null,
          tamanho_equipe: form.tamanho_equipe || null,
          modelo_trabalho: form.modelo_trabalho || null,
          modelo_precificacao: form.modelo_precificacao || null,
          email_contato: form.email_contato.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
          site_url: form.site_url.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          instagram_url: form.instagram_url.trim() || null,
          portfolio: form.portfolio,
          equipe: form.equipe,
          perguntas_frequentes: form.perguntas_frequentes,
        })
        .eq("id", data.prestador.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meu-prestador"] });
      await queryClient.invalidateQueries({ queryKey: ["prestador", data?.prestador.slug] });
      toast.success("Perfil atualizado — a vitrine pública já reflete as mudanças.");
    },
    onError: () => toast.error("Não foi possível atualizar o perfil."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!data) return <p className="text-sm text-muted-foreground">Complete o onboarding primeiro.</p>;

  return (
    <div className="space-y-6">
      <PainelHeader
        eyebrow="Credencial"
        titulo="Perfil público"
        descricao={
          <>
            Endereço da vitrine: <code>/pro/{data.prestador.slug}</code>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <form
        className="surface-panel min-w-0 space-y-6 p-8"
        onSubmit={(e) => {
          e.preventDefault();
          salvar.mutate();
        }}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">
              {form.tipo_prestador === "freelancer" ? "Seu nome profissional" : "Nome do negócio"}
            </Label>
            <Input
              id="nome"
              required
              maxLength={120}
              value={form.nome_negocio}
              onChange={(e) => setForm({ ...form, nome_negocio: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria principal</Label>
            <Select
              value={form.categoria_principal}
              onValueChange={(v) => setForm({ ...form, categoria_principal: v })}
            >
              <SelectTrigger id="categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea
            id="descricao"
            rows={6}
            maxLength={2000}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="headline">Frase de apresentação</Label>
          <Input
            id="headline"
            maxLength={120}
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            placeholder="BPO financeiro e contábil para empresas de serviço"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategorias">Especialidades (separadas por vírgula)</Label>
          <Input
            id="subcategorias"
            maxLength={300}
            value={form.subcategorias}
            onChange={(e) => setForm({ ...form, subcategorias: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="foto">Foto ou Logo do perfil</Label>
          <div className="flex items-center gap-4">
            <div className="relative group">
              {form.foto_perfil_url ? (
                <img
                  src={form.foto_perfil_url}
                  className="size-16 rounded-xl object-cover ring-1 ring-border"
                  alt="Perfil"
                />
              ) : (
                <div className="size-16 rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center">
                  <ImageIcon className="size-6 text-muted-foreground" />
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-transform">
                <Upload className="size-3" />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${crypto.randomUUID()}.${fileExt}`;
                      const filePath = `logos/${fileName}`;
                      const { error } = await supabase.storage.from("prestadores").upload(filePath, file);
                      if (error) throw error;
                      const { data: { publicUrl } } = supabase.storage.from("prestadores").getPublicUrl(filePath);
                      setForm({ ...form, foto_perfil_url: publicUrl });
                      toast.success("Foto atualizada!");
                    } catch (err) {
                      console.error("Upload error:", err);
                      toast.error(err instanceof Error ? err.message : "Erro no upload");
                    }
                  }}
                />
              </label>
            </div>
            <Input
              id="foto"
              className="flex-1"
              type="url"
              maxLength={500}
              value={form.foto_perfil_url}
              onChange={(e) => setForm({ ...form, foto_perfil_url: e.target.value })}
              placeholder="Ou cole a URL direta aqui..."
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="regiao">Região de atendimento</Label>
            <Input
              id="regiao"
              maxLength={120}
              value={form.regiao_atendimento}
              onChange={(e) => setForm({ ...form, regiao_atendimento: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              maxLength={80}
              value={form.cidade}
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado (UF)</Label>
            <Input
              id="estado"
              maxLength={2}
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="faixa">Faixa de preço</Label>
            <Select
              value={form.faixa_preco}
              onValueChange={(v) => setForm({ ...form, faixa_preco: v })}
            >
              <SelectTrigger id="faixa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FAIXAS_PRECO.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientes">Clientes atendidos</Label>
            <Input
              id="clientes"
              type="number"
              min={0}
              value={form.total_clientes_atendidos}
              onChange={(e) => setForm({ ...form, total_clientes_atendidos: e.target.value })}
            />
          </div>
        </div>

        <div className={`grid gap-6 ${form.tipo_prestador === "agencia" ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}>
          {form.tipo_prestador === "agencia" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ano">Ano de fundação</Label>
                <Input
                  id="ano"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={form.ano_fundacao}
                  onChange={(e) => setForm({ ...form, ano_fundacao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipe">Tamanho da equipe</Label>
                <Select
                  value={form.tamanho_equipe}
                  onValueChange={(v) => setForm({ ...form, tamanho_equipe: v })}
                >
                  <SelectTrigger id="equipe">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAMANHOS_EQUIPE.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="modo">Modo de atendimento</Label>
            <Select
              value={form.modelo_trabalho}
              onValueChange={(v) => setForm({ ...form, modelo_trabalho: v })}
            >
              <SelectTrigger id="modo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELOS_TRABALHO.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 sm:max-w-xs">
          <Label htmlFor="precificacao">Modelo de cobrança</Label>
          <Select
            value={form.modelo_precificacao}
            onValueChange={(v) => setForm({ ...form, modelo_precificacao: v })}
          >
            <SelectTrigger id="precificacao">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELOS_PRECIFICACAO.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email_contato">E-mail comercial</Label>
            <Input
              id="email_contato"
              type="email"
              maxLength={160}
              value={form.email_contato}
              onChange={(e) => setForm({ ...form, email_contato: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp comercial</Label>
            <Input
              id="whatsapp"
              inputMode="tel"
              maxLength={20}
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site">Site</Label>
            <Input
              id="site"
              type="url"
              maxLength={300}
              value={form.site_url}
              onChange={(e) => setForm({ ...form, site_url: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input
              id="linkedin"
              type="url"
              maxLength={300}
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              type="url"
              maxLength={300}
              value={form.instagram_url}
              onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
            />
          </div>
        </div>
 
        <div className="space-y-6 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">O Time</Label>
              <p className="text-sm text-muted-foreground">
                Apresente as pessoas-chave da sua operação.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setForm({
                  ...form,
                  equipe: [
                    ...(form.equipe || []),
                    { nome: "", cargo: "" },
                  ],
                });
              }}
            >
              <Plus className="mr-2 size-4" /> Adicionar membro
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(form.equipe || []).map((membro: any, idx: number) => (
              <div key={idx} className="group relative rounded-xl border border-border bg-muted/30 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      className="bg-background"
                      value={membro.nome}
                      onChange={(e) => {
                        const nova = [...form.equipe];
                        nova[idx].nome = e.target.value;
                        setForm({ ...form, equipe: nova });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Cargo / Especialidade</Label>
                    <Input
                      className="bg-background"
                      value={membro.cargo}
                      onChange={(e) => {
                        const nova = [...form.equipe];
                        nova[idx].cargo = e.target.value;
                        setForm({ ...form, equipe: nova });
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nova = form.equipe.filter((_: any, i: number) => i !== idx);
                    setForm({ ...form, equipe: nova });
                  }}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Dúvidas Frequentes (FAQ)</Label>
              <p className="text-sm text-muted-foreground">
                Responda as perguntas mais comuns para reduzir fricção no contato.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setForm({
                  ...form,
                  perguntas_frequentes: [
                    ...(form.perguntas_frequentes || []),
                    { pergunta: "", resposta: "" },
                  ],
                });
              }}
            >
              <Plus className="mr-2 size-4" /> Adicionar pergunta
            </Button>
          </div>

          <div className="space-y-4">
            {(form.perguntas_frequentes || []).map((item: any, idx: number) => (
              <div key={idx} className="group relative rounded-xl border border-border bg-muted/30 p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Pergunta</Label>
                    <Input
                      className="bg-background"
                      value={item.pergunta}
                      onChange={(e) => {
                        const nova = [...form.perguntas_frequentes];
                        nova[idx].pergunta = e.target.value;
                        setForm({ ...form, perguntas_frequentes: nova });
                      }}
                      placeholder="Ex: Qual o prazo médio de entrega?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Resposta</Label>
                    <Textarea
                      className="bg-background"
                      rows={2}
                      value={item.resposta}
                      onChange={(e) => {
                        const nova = [...form.perguntas_frequentes];
                        nova[idx].resposta = e.target.value;
                        setForm({ ...form, perguntas_frequentes: nova });
                      }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nova = form.perguntas_frequentes.filter((_: any, i: number) => i !== idx);
                    setForm({ ...form, perguntas_frequentes: nova });
                  }}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Portfólio</Label>
              <p className="text-sm text-muted-foreground">
                Destaque seus melhores trabalhos, links ou vídeos.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setForm({
                  ...form,
                  portfolio: [
                    ...form.portfolio,
                    { id: Math.random().toString(36), titulo: "", tipo: "imagem", url: "" },
                  ],
                });
              }}
            >
              <Plus className="mr-2 size-4" /> Adicionar item
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {form.portfolio.map((item, idx) => (
              <div
                key={item.id || idx}
                className="group relative rounded-xl border border-border bg-muted/30 p-4 transition-all hover:bg-muted/50"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Título</Label>
                    <Input
                      className="bg-background"
                      value={item.titulo}
                      onChange={(e) => {
                        const novo = [...form.portfolio];
                        novo[idx].titulo = e.target.value;
                        setForm({ ...form, portfolio: novo });
                      }}
                      placeholder="Ex: Case de sucesso..."
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={item.tipo}
                        onValueChange={(v) => {
                          const novo = [...form.portfolio];
                          novo[idx].tipo = v;
                          setForm({ ...form, portfolio: novo });
                        }}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="imagem">Imagem</SelectItem>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="link">Link</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Conteúdo</Label>
                      <div className="flex gap-2">
                        <Input
                          className="bg-background flex-1"
                          value={item.url}
                          onChange={(e) => {
                            const novo = [...form.portfolio];
                            novo[idx].url = e.target.value;
                            setForm({ ...form, portfolio: novo });
                          }}
                          placeholder={item.tipo === "link" ? "https://..." : "URL ou faça upload"}
                        />
                        {(item.tipo === "imagem" || item.tipo === "video") && (
                          <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background hover:bg-muted transition-colors">
                            <Upload className="size-4 text-muted-foreground" />
                            <input
                              type="file"
                              accept={item.tipo === "imagem" ? "image/*" : "video/*"}
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const promise = (async () => {
                                  const fileExt = file.name.split('.').pop();
                                  const fileName = `${crypto.randomUUID()}.${fileExt}`;
                                  const filePath = `portfolio/${fileName}`;
                                  const { error } = await supabase.storage.from("prestadores").upload(filePath, file);
                                  if (error) throw error;
                                  const { data: { publicUrl } } = supabase.storage.from("prestadores").getPublicUrl(filePath);
                                  const novo = [...form.portfolio];
                                  novo[idx].url = publicUrl;
                                  setForm({ ...form, portfolio: novo });
                                  return publicUrl;
                                })();

                                toast.promise(promise, {
                                  loading: 'Enviando arquivo...',
                                  success: 'Arquivo enviado!',
                                  error: 'Erro no upload',
                                });
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const novo = form.portfolio.filter((_, i) => i !== idx);
                    setForm({ ...form, portfolio: novo });
                  }}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>

          {form.portfolio.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum item adicionado ao portfólio.
              </p>
            </div>
          )}
        </div>

        <div className="pt-6">
          <Button type="submit" disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>

      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Prévia da vitrine
        </p>
        <PreviewVitrine
          dados={{
            nome_negocio: form.nome_negocio,
            headline: form.headline,
            descricao: form.descricao,
            categoria_principal: form.categoria_principal,
            faixa_preco: form.faixa_preco,
            cidade: form.cidade,
            estado: form.estado,
            regiao_atendimento: form.regiao_atendimento,
            foto_perfil_url: form.foto_perfil_url,
            modelo_trabalho: form.modelo_trabalho,
            total_clientes_atendidos: form.total_clientes_atendidos,
            subcategorias: form.subcategorias
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
          }}
        />
        <a
          className="mt-3 inline-block text-xs text-primary underline"
          href={`/pro/${data.prestador.slug}`}
          target="_blank"
          rel="noreferrer"
        >
          Abrir vitrine pública
        </a>
      </aside>
      </div>
    </div>
  );
}
