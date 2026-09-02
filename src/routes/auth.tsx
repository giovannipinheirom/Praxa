import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { 
  Briefcase, 
  Building2, 
  Loader2, 
  ShieldCheck, 
  Mail, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Star,
  Chrome
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { AccountType } from "@/hooks/use-session";
import { ensurePrestadorRecord, updateProfileContact } from "@/lib/onboarding";
import { motion, AnimatePresence } from "framer-motion";

const searchSchema = z.object({
  modo: z.enum(["entrar", "criar", "recuperar"]).catch("entrar"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta | Praxa" },
      {
        name: "description",
        content:
          "Acesse a Praxa para contratar serviços profissionais B2B ou publicar a vitrine da sua empresa prestadora.",
      },
      { property: "og:title", content: "Entrar ou criar conta | Praxa" },
      {
        property: "og:description",
        content: "Marketplace B2B de serviços profissionais com reputação verificada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { modo } = Route.useSearch();
  const navigate = useNavigate();
  const isSignup = modo === "criar";
  const isRecovery = modo === "recuperar";

  const [accountType, setAccountType] = useState<AccountType>("cliente");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (isRecovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/redefinir-senha",
        });
        if (error) throw error;
        toast.success("Enviamos um link de recuperação para o seu e-mail.");
        navigate({ to: "/auth", search: { modo: "entrar" } });
      } else if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              company_name: companyName,
              account_type: accountType,
              phone,
            },
          },
        });
        if (error) throw error;

        const userId = data.session?.user?.id;
        if (userId) {
          await updateProfileContact({ userId, telefone: phone });
          if (accountType === "prestador" || accountType === "freelancer") {
            await ensurePrestadorRecord({
              userId,
              nomeNegocio: companyName || fullName,
              tipo: accountType === "freelancer" ? "freelancer" : "agencia",
            });
          }
        }

        toast.success(
          accountType === "prestador"
            ? "Conta de prestador criada! Complete sua vitrine no painel."
            : "Conta criada! Verifique seu e-mail se a confirmação for exigida.",
        );
        navigate({ to: "/painel" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/painel" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setLoading(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* LADO ESQUERDO - Identidade Landing */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#0B1220] p-12 text-white lg:flex">
        {/* Glows e Elementos Flutuantes */}
        <div className="absolute top-0 left-0 h-full w-full pointer-events-none">
          <div className="absolute top-[20%] left-[10%] size-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[20%] right-[10%] size-80 rounded-full bg-primary/5 blur-[100px]" />
          
          {/* Glows mantidos para profundidade, mas removidos os blocos flutuantes conforme solicitado */}
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between">
          <Logo inverted className="w-fit" />

          <div className="max-w-lg">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-[52px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl"
            >
              Reputação verificada <br />
              <span className="text-primary">move bons negócios.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-xl leading-relaxed text-white/60 font-medium"
            >
              Encontre empresas em quem vale a pena confiar ou destaque sua expertise para o mercado B2B.
            </motion.p>

            <motion.ul 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12 space-y-5"
            >
              {[
                { label: "Empresas verificadas", icon: ShieldCheck },
                { label: "Avaliações reais", icon: Star },
                { label: "Comparação transparente", icon: CheckCircle2 },
              ].map((item) => (
                <li key={item.label} className="flex items-center gap-4 text-lg font-semibold text-white/90">
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <item.icon className="size-4" strokeWidth={2.5} />
                  </div>
                  {item.label}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="mt-12 flex items-center gap-3">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-bold uppercase tracking-widest text-white/30">
              Praxa Marketplace B2B
            </span>
          </div>
        </div>
      </section>

      {/* LADO DIREITO - Formulário Premium */}
      <section className="flex flex-col items-center justify-center bg-background px-6 py-12 sm:px-12 lg:px-24">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px] space-y-10"
        >
          <div className="lg:hidden mb-8">
            <Logo />
          </div>

          <div className="space-y-3 text-left">
            <h2 className="font-display text-[32px] font-extrabold tracking-tight text-ink">
              {isRecovery ? "Recuperar senha" : isSignup ? "Comece agora" : "Bem-vindo de volta"}
            </h2>
            <p className="text-lg text-muted-foreground font-medium">
              {isRecovery
                ? "Digite seu e-mail para receber um link de redefinição."
                : isSignup
                ? "Crie sua conta na maior rede B2B do país."
                : "Acesse sua conta e gerencie seus negócios."}
            </p>
          </div>

          {isSignup && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {(
                [
                  { value: "cliente", label: "Sou cliente", icon: Building2 },
                  { value: "prestador", label: "Sou agência / empresa", icon: Building2 },
                  { value: "freelancer", label: "Sou profissional autônomo", icon: Briefcase },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAccountType(option.value)}
                  className={cn(
                    "relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all duration-300",
                    accountType === option.value
                      ? "border-primary bg-primary/[0.03] shadow-[0_8px_20px_-8px_rgba(31,111,92,0.15)]"
                      : "border-border/60 bg-white hover:border-primary/40",
                  )}
                >
                  <div className={cn(
                    "flex size-10 items-center justify-center rounded-xl transition-colors",
                    accountType === option.value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <option.icon className="size-5" />
                  </div>
                  <span className={cn(
                    "text-sm font-bold tracking-tight transition-colors leading-tight",
                    accountType === option.value ? "text-ink" : "text-muted-foreground"
                  )}>
                    {option.label}
                  </span>
                  
                  {accountType === option.value && (
                    <motion.div 
                      layoutId="activeAccount"
                      className="absolute top-3 right-3 text-primary"
                    >
                      <CheckCircle2 className="size-4" fill="currentColor" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {isSignup && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-widest text-ink/60">
                      Nome completo
                    </Label>
                    <div className="relative group">
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-14 rounded-xl border-border/60 bg-white px-5 text-base font-medium transition-all group-focus-within:border-primary group-focus-within:ring-[3px] group-focus-within:ring-primary/10"
                        placeholder="Ex: Ana Ribeiro"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-xs font-bold uppercase tracking-widest text-ink/60">
                      {accountType === "freelancer" ? "Seu nome profissional" : accountType === "prestador" ? "Nome do seu negócio" : "Sua empresa"}
                    </Label>
                    <div className="relative group">
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required={accountType === "prestador"}
                        className="h-14 rounded-xl border-border/60 bg-white px-5 text-base font-medium transition-all group-focus-within:border-primary group-focus-within:ring-[3px] group-focus-within:ring-primary/10"
                        placeholder={accountType === "freelancer" ? "Ex: Ana Design" : accountType === "prestador" ? "Ex: Soluções Digitais Ltda" : "Ex: Google Brasil"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-ink/60">
                      Telefone / WhatsApp
                    </Label>
                    <div className="relative group">
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-14 rounded-xl border-border/60 bg-white px-5 text-base font-medium transition-all group-focus-within:border-primary group-focus-within:ring-[3px] group-focus-within:ring-primary/10"
                        placeholder="(11) 90000-0000"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-ink/60">
                E-mail corporativo
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-xl border-border/60 bg-white pl-12 pr-5 text-base font-medium transition-all group-focus-within:border-primary group-focus-within:ring-[3px] group-focus-within:ring-primary/10"
                  placeholder="voce@empresa.com"
                />
              </div>
            </div>

            {!isRecovery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-ink/60">
                    Senha
                  </Label>
                  {!isSignup && (
                    <Link
                      to="/auth"
                      search={{ modo: "recuperar" }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-14 rounded-xl border-border/60 bg-white pl-12 pr-5 text-base font-medium transition-all group-focus-within:border-primary group-focus-within:ring-[3px] group-focus-within:ring-primary/10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="relative h-14 w-full overflow-hidden rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isRecovery ? "Enviar link de recuperação" : isSignup ? "Criar conta gratuita" : "Entrar na plataforma"}
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>

          {!isRecovery && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 font-bold tracking-widest text-muted-foreground">ou</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-14 w-full rounded-xl border-border/60 bg-white text-base font-bold text-ink transition-all hover:bg-secondary/50 active:scale-[0.98]"
                  onClick={handleGoogle} 
                  disabled={loading}
                >
                  <div className="flex items-center gap-3">
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="hidden sm:inline">Google</span>
                    <span className="sm:hidden">Entrar com Google</span>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-14 w-full rounded-xl border-border/60 bg-white text-base font-bold text-ink transition-all hover:bg-secondary/50 active:scale-[0.98]"
                  onClick={() => toast.info("Acesso via Apple ID em breve.")} 
                  disabled={loading}
                >
                  <div className="flex items-center gap-3">
                    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05 1.78-3.19 1.76-1.14-.02-1.5-.72-2.82-.72-1.32 0-1.74.7-2.82.74-1.08.04-2.25-.91-3.23-1.86-2-1.92-3.53-5.42-3.53-8.62 0-3.19 2.06-4.88 4.02-4.88 1.04 0 2.03.72 2.66.72.63 0 1.83-.87 3.09-.87 1.32 0 2.45.68 3.17 1.73-2.63 1.55-2.2 5.25.54 6.37-.8 2.02-1.86 4.03-2.87 4.63zm-3.83-16.12c.56-.68.94-1.63.84-2.58-.82.03-1.81.54-2.4 1.23-.53.62-.99 1.59-.87 2.52.92.07 1.87-.49 2.43-1.17z"/>
                    </svg>
                    <span className="hidden sm:inline">Apple</span>
                    <span className="sm:hidden">Entrar com Apple</span>
                  </div>
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-base font-medium text-muted-foreground">
            {isRecovery ? "Lembrou sua senha?" : isSignup ? "Já faz parte da rede?" : "Ainda não tem acesso?"}{" "}
            <Link
              to="/auth"
              search={{ modo: isRecovery ? "entrar" : isSignup ? "entrar" : "criar" }}
              className="font-bold text-primary hover:underline"
            >
              {isRecovery ? "Voltar ao login" : isSignup ? "Fazer login" : "Criar conta agora"}
            </Link>
          </p>
        </motion.div>
      </section>
    </main>
  );
}
