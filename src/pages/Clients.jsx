import { useState, useMemo } from "react";
import { Search, Plus, Trash2, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients, useRefreshData } from "@/hooks/useData";
import ClientDialog from "@/components/clients/ClientDialog";
import EditableCell from "@/components/clients/EditableCell";
import FollowUpSection from "@/components/clients/FollowUpSection";
import { exportClientsToCsv } from "@/lib/exportCsv";

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
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <h1 className="font-display font-bold text-xl md:text-2xl">
          Clients <span className="text-muted-foreground font-semibold">({clients.length})</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportClientsToCsv(filtered)}
            disabled={clients.length === 0}
            className="gap-2"
          >
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exporter CSV</span>
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
      </div>

      <FollowUpSection clients={clients} />

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