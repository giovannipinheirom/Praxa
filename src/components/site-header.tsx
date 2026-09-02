import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Bell, 
  Building2, 
  Check, 
  ChevronDown, 
  LogOut, 
  Search,
  X
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader({ variant = "public" }: { variant?: "public" | "painel" }) {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchExpanded, setSearchExpanded] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (variant === "painel") {
    return (
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[84rem] items-center justify-between gap-6 px-6 py-3">
          <div className="flex items-center gap-8 flex-1">
            <Logo />
            
            <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar clientes, propostas ou demandas..."
                  className="w-full bg-secondary/50 pl-9 border-none h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Seletor de Unidade (Enterprise Ready) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden lg:flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 h-9">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">Unidade Matriz</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Suas Unidades</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="bg-accent/50">
                  <Building2 className="mr-2 size-4" />
                  <span>Unidade Matriz</span>
                  <Check className="ml-auto size-4 text-primary" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-xs text-muted-foreground italic">
                  Adicione filiais no plano Enterprise
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="relative size-9 rounded-lg">
              <Bell className="size-4.5" />
              <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-primary" />
            </Button>

            <div className="h-6 w-px bg-border/60 mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-secondary">
                  <div className="grid size-7 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-gold-ink uppercase">
                    P
                  </div>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/" className="cursor-pointer">Ver perfil público</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-12">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {/* Navegação Central - Estilo Pill (Bling inspired) */}
        <nav className="hidden lg:flex items-center">
          <div className="flex items-center gap-1 rounded-full border border-border/50 bg-white px-2 py-1.5 shadow-md shadow-ink/5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-1 rounded-full px-4 text-sm font-medium text-foreground/80 hover:bg-secondary/80">
                  Plataforma
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>Visão Geral</DropdownMenuItem>
                <DropdownMenuItem>Recursos</DropdownMenuItem>
                <DropdownMenuItem>Integrações</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 gap-1 rounded-full px-4 text-sm font-medium text-foreground/80 hover:bg-secondary/80">
                  Soluções
                  <ChevronDown className="size-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>Para Pequenas Empresas</DropdownMenuItem>
                <DropdownMenuItem>Para Freelancers</DropdownMenuItem>
                <DropdownMenuItem>Para Agências</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild variant="ghost" size="sm" className="h-9 rounded-full px-4 text-sm font-medium text-foreground/80 hover:bg-secondary/80">
              <a href="/#categorias">Categorias</a>
            </Button>

            <Button asChild variant="ghost" size="sm" className="h-9 rounded-full px-4 text-sm font-medium text-foreground/80 hover:bg-secondary/80">
              <Link to="/">Preços</Link>
            </Button>

            <Button asChild variant="ghost" size="sm" className="h-9 rounded-full px-4 text-sm font-medium text-foreground/80 hover:bg-secondary/80">
              <Link to="/">Contato</Link>
            </Button>
          </div>
        </nav>

        {/* Ações à Direita */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Busca Expansível */}
          <div className="hidden sm:flex items-center">
            <div className={`flex items-center transition-all duration-300 ease-in-out ${searchExpanded ? 'w-64' : 'w-10'}`}>
              {searchExpanded ? (
                <div className="relative flex w-full items-center">
                  <Input 
                    autoFocus
                    placeholder="O que você procura?" 
                    className="h-10 w-full rounded-full border-border/60 bg-white pl-10 pr-10 text-sm shadow-sm"
                    onBlur={() => setSearchExpanded(false)}
                  />
                  <Search className="absolute left-3.5 size-4 text-muted-foreground" />
                  <button 
                    onClick={() => setSearchExpanded(false)}
                    className="absolute right-3.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-10 rounded-full text-foreground/70 hover:bg-white hover:text-foreground"
                  onClick={() => setSearchExpanded(true)}
                >
                  <Search className="size-5" />
                </Button>
              )}
            </div>
          </div>

          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex h-10 rounded-full px-5 text-sm font-semibold">
                <Link to="/painel">Meu painel</Link>
              </Button>
              <Button variant="outline" size="sm" className="h-10 rounded-full px-5 text-sm font-semibold border-border/60" onClick={handleSignOut}>
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="group h-11 gap-2 rounded-full px-5 text-sm font-semibold text-foreground/80 hover:text-foreground">
                <Link to="/auth" search={{ modo: "entrar" }} className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-full border border-border/60 bg-white shadow-sm transition-colors group-hover:bg-secondary">
                    <LogOut className="size-3.5 rotate-180 text-muted-foreground" />
                  </div>
                  Login
                </Link>
              </Button>
              
              <Button asChild className="hidden h-11 items-center rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl sm:flex">
                <Link to="/auth" search={{ modo: "criar" }}>
                  Teste grátis
                </Link>
              </Button>
            </div>
          )}

          {/* Login Mobile */}
          {!user && !loading && (
            <Button asChild variant="ghost" size="icon" className="size-10 rounded-full border border-border/50 bg-white/50 shadow-sm sm:hidden">
              <Link to="/auth" search={{ modo: "entrar" }}>
                <LogOut className="size-4 rotate-180 text-muted-foreground" />
              </Link>
            </Button>
          )}

          {/* Menu Mobile Button */}
          <div className="flex items-center lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-10 rounded-full border border-border/50 bg-white/50 shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm sm:w-96 flex flex-col p-6">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle className="flex items-center">
                    <Logo />
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col flex-1 gap-6 overflow-y-auto">
                  <nav className="flex flex-col space-y-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plataforma</div>
                    <Link to="/" className="text-lg font-medium text-foreground/80 hover:text-foreground">Visão Geral</Link>
                    <Link to="/" className="text-lg font-medium text-foreground/80 hover:text-foreground">Como funciona</Link>
                    <Link to="/#categorias" className="text-lg font-medium text-foreground/80 hover:text-foreground">Categorias</Link>
                  </nav>
                  
                  <div className="h-px bg-border/50" />
                  
                  <nav className="flex flex-col space-y-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa</div>
                    <Link to="/" className="text-lg font-medium text-foreground/80 hover:text-foreground">Preços</Link>
                    <Link to="/" className="text-lg font-medium text-foreground/80 hover:text-foreground">Para prestadores</Link>
                    <Link to="/" className="text-lg font-medium text-foreground/80 hover:text-foreground">Contato</Link>
                  </nav>
                </div>

                {!user && (
                  <div className="mt-auto pt-6 border-t border-border/50">
                    <Button asChild className="w-full h-12 rounded-xl bg-primary font-bold text-primary-foreground shadow-lg">
                      <Link to="/auth" search={{ modo: "criar" }}>Criar conta grátis</Link>
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}


