import { useState, useMemo } from "react";
import { Search, Plus, Users, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients, useRefreshData } from "@/hooks/useData";
import ClientDialog from "@/components/clients/ClientDialog";
import EditableCell from "@/components/clients/EditableCell";

export default function Clients() {
  const { data: clients } = useClients();
  const refresh = useRefreshData();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.full_name, c.phone, c.email, c.city].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [clients, query]);

  const updateField = async (client, field, value) => {
    await base44.entities.Client.update(client.id, { [field]: value });
    refresh();
  };

  const removeClient = async (client) => {
    await base44.entities.Client.delete(client.id);
    refresh();
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
        <Button size="sm" onClick={() => setDialogOpen(true)} className="ml-auto gap-1.5">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      <div className="flex flex-col min-h-0 flex-1 bg-card rounded-2xl border border-border">
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

        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 text-sm">
              Aucun client {query && "trouvé"}.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="text-left text-xs font-semibold text-muted-foreground border-b border-border">
                  <th className="px-3 py-2.5 font-semibold">Nom</th>
                  <th className="px-3 py-2.5 font-semibold">Téléphone</th>
                  <th className="px-3 py-2.5 font-semibold">Ville</th>
                  <th className="px-3 py-2.5 font-semibold">E-mail</th>
                  <th className="px-3 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
                    <td className="px-1.5 py-1 align-middle">
                      <EditableCell value={c.full_name} placeholder="Nom…" onSave={(v) => updateField(c, "full_name", v)} />
                    </td>
                    <td className="px-1.5 py-1 align-middle">
                      <EditableCell value={c.phone} type="tel" placeholder="Téléphone…" onSave={(v) => updateField(c, "phone", v)} />
                    </td>
                    <td className="px-1.5 py-1 align-middle">
                      <EditableCell value={c.city} placeholder="Ville…" onSave={(v) => updateField(c, "city", v)} />
                    </td>
                    <td className="px-1.5 py-1 align-middle">
                      <EditableCell value={c.email} type="email" placeholder="E-mail…" onSave={(v) => updateField(c, "email", v)} />
                    </td>
                    <td className="px-1.5 py-1 align-middle text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeClient(c)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} client={null} />
    </div>
  );
}