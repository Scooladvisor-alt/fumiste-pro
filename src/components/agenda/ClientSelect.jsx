import { useState } from "react";
import { Check, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NewClientForm from "./NewClientForm";

export default function ClientSelect({ clients, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("search"); // "search" | "create"
  const selected = clients.find((c) => c.id === value);

  const reset = () => {
    setMode("search");
    setSearch("");
  };

  const handleCreated = (client) => {
    onChange(client.id, client);
    setOpen(false);
    reset();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-start font-normal h-11 pr-12"
            onClick={() => setMode("search")}
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                {selected.full_name}
              </span>
            ) : (
              <span className="text-muted-foreground">Rechercher un client…</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Nouveau client"
            onClick={() => setMode("create")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-primary hover:bg-accent"
          >
            <Plus className="w-4 h-4" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[280px] p-0 bg-popover z-[60] shadow-xl border border-border rounded-lg overflow-hidden"
        align="start"
      >
        {mode === "create" ? (
          <NewClientForm
            initialName={search}
            onCreated={handleCreated}
            onBack={() => setMode("search")}
          />
        ) : (
          <Command className="bg-popover h-auto">
            <CommandInput placeholder="Nom du client…" value={search} onValueChange={setSearch} />
            <CommandList className="max-h-60 min-h-[120px]">
              <CommandEmpty>Aucun client trouvé.</CommandEmpty>
              <CommandGroup>
                {clients.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.full_name} ${c.phone} ${c.city || ""}`}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")}
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">{c.full_name}</span>
                      <span className="text-xs text-muted-foreground">{c.phone}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}