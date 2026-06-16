import { useState } from "react";
import { Check, ChevronsUpDown, User, UserPlus } from "lucide-react";
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

  const handleCreated = (id) => {
    onChange(id);
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
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal h-11"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              {selected.full_name}
            </span>
          ) : (
            <span className="text-muted-foreground">Rechercher ou créer un client…</span>
          )}
          <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        {mode === "create" ? (
          <NewClientForm
            initialName={search}
            onCreated={handleCreated}
            onBack={() => setMode("search")}
          />
        ) : (
          <Command>
            <CommandInput placeholder="Nom du client…" value={search} onValueChange={setSearch} />
            <div className="border-b border-border p-1">
              <button
                type="button"
                onClick={() => setMode("create")}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-accent text-primary font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Nouveau client{search.trim() ? ` « ${search.trim()} »` : ""}
              </button>
            </div>
            <CommandList>
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