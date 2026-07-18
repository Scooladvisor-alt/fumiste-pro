import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CertificatForm({ form, onChange }) {
  const set = (k, v) => onChange({ ...form, [k]: v });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Résultat de l'intervention</Label>
        <Select value={form.conforme} onValueChange={(v) => set("conforme", v)}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="conforme">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Conforme
              </span>
            </SelectItem>
            <SelectItem value="non_conforme">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Non conforme
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Observations</Label>
        <Textarea
          value={form.observations}
          onChange={(e) => set("observations", e.target.value)}
          placeholder="Observations sur l'intervention…"
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Non-conformités éventuelles</Label>
        <Textarea
          value={form.non_conformites}
          onChange={(e) => set("non_conformites", e.target.value)}
          placeholder="Non-conformités constatées, le cas échéant…"
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Commentaires complémentaires</Label>
        <Textarea
          value={form.commentaires}
          onChange={(e) => set("commentaires", e.target.value)}
          placeholder="Commentaires additionnels…"
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );
}