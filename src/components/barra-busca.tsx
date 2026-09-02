import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugifyRegiao } from "@/lib/marketplace";

export function BarraBusca({
  categoriaInicial = "",
  regiaoInicial = "",
}: {
  categoriaInicial?: string;
  regiaoInicial?: string;
}) {
  const navigate = useNavigate();
  const [termo, setTermo] = useState(categoriaInicial);
  const [regiao, setRegiao] = useState(regiaoInicial);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const categoria = slugifyRegiao(termo) || "todas";
    const regiaoSlug = slugifyRegiao(regiao) || "todos";
    navigate({
      to: "/buscar/$categoria/$regiao",
      params: { categoria, regiao: regiaoSlug },
      search: { tipo: undefined },
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-[2rem] md:rounded-full border border-slate-100 bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.06)] md:flex-row md:items-center"
    >
      <div className="flex flex-[1.4] items-center gap-3 px-4 md:px-6">
        <Search className="size-5 shrink-0 text-slate-400" />
        <Input
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="O que você precisa? Ex.: contabilidade"
          aria-label="O que você precisa"
          className="h-12 md:h-14 border-0 px-0 text-base md:text-lg font-medium placeholder:text-slate-400 shadow-none focus-visible:ring-0"
        />
      </div>
      <div className="hidden h-10 w-px bg-slate-100 md:block" />
      <div className="flex flex-1 items-center gap-3 px-4 md:px-6">
        <MapPin className="size-5 shrink-0 text-slate-400" />
        <Input
          value={regiao}
          onChange={(e) => setRegiao(e.target.value)}
          placeholder="Onde? Ex.: Campinas"
          aria-label="Onde"
          className="h-12 md:h-14 border-0 px-0 text-base md:text-lg font-medium placeholder:text-slate-400 shadow-none focus-visible:ring-0"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 md:h-14 rounded-2xl md:rounded-full px-8 md:px-12 text-base md:text-lg font-bold w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
        Buscar
      </Button>
    </form>

  );
}
