import { useState, useMemo } from "react";
import { Search, Plus, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useData";
import ClientDialog from "@/components/clients/ClientDialog";
import ClientDetail from "@/components/clients/ClientDetail";

export default function Clients() {
  const { data: clients } = useClients();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.full_name, c.phone, c.email, c.city].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [clients, query]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 h-screen flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl">Clients</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {clients.length} client{clients.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={openNew} className="ml-auto gap-1.5">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-[1fr_380px] gap-4 flex-1 min-h-0">
        {/* List */}
        <div className="flex flex-col min-h-0 bg-card rounded-2xl border border-border">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un client…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-11 border-0 bg-secondary focus-visible:ring-1"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {filtered.length === 0 && (
              <div className="text-center text-muted-foreground py-16 text-sm">
                Aucun client {query && "trouvé"}.
              </div>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                  selected?.id === c.id ? "bg-accent" : "hover:bg-secondary"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                  {c.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{c.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.phone}{c.city ? ` · ${c.city}` : ""}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
          {selected ? (
            <ClientDetail client={clients.find((c) => c.id === selected.id)} onClose={() => setSelected(null)} onEdit={openEdit} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Sélectionnez un client pour voir ses détails et rendez-vous.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile detail overlay */}
      {selected && (
        <div className="md:hidden fixed inset-0 z-30 bg-background">
          <ClientDetail client={clients.find((c) => c.id === selected.id)} onClose={() => setSelected(null)} onEdit={openEdit} />
        </div>
      )}

      <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editing} />
    </div>
  );
}