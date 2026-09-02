import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha | Praxa" },
      { name: "description", content: "Crie uma nova senha para o seu acesso na Praxa." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      
      setSuccess(true);
      toast.success("Sua senha foi redefinida com sucesso!");
      
      // Delay navigation so user can see success message
      setTimeout(() => {
        navigate({ to: "/painel" });
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-[420px] space-y-10">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        <div className="space-y-3 text-center">
          <h2 className="font-display text-[32px] font-extrabold tracking-tight text-ink">
            Criar nova senha
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Digite sua nova senha de acesso abaixo.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
            <CheckCircle2 className="size-12 text-primary" />
            <p className="text-lg font-bold text-ink">Senha redefinida!</p>
            <p className="text-sm text-muted-foreground">Redirecionando para o painel...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-ink/60">
                Nova senha
              </Label>
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

            <Button 
              type="submit" 
              className="relative h-14 w-full overflow-hidden rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                "Salvar nova senha"
              )}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
