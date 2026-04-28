import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { listFormFields, createFormField, updateFormField, deleteFormField } from "@/api/formFieldsApi";
import { updateEvent } from "@/api/eventsApi";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown,
  GripVertical, Loader2, X, Check,
} from "lucide-react";

const FIELD_TYPES = [
  { value: "text",     label: "Texte court" },
  { value: "textarea", label: "Texte long" },
  { value: "number",   label: "Nombre" },
  { value: "email",    label: "Email" },
  { value: "tel",      label: "Téléphone" },
  { value: "date",     label: "Date" },
  { value: "select",   label: "Liste de choix" },
  { value: "checkbox", label: "Case à cocher" },
];

const TYPE_LABELS = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t.label]));

const slugify = (str) =>
  str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);

const EMPTY_FORM = {
  field_key: "",
  field_label: "",
  field_type: "text",
  placeholder: "",
  is_required: false,
  is_visible: true,
  sort_order: 0,
  field_options: [],
};

function FieldForm({ event, initial, onSave, onCancel, isSaving }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initial,
    field_options: initial?.field_options ?? [],
    sort_order: initial?.sort_order ?? 0,
  }));
  const [keyTouched, setKeyTouched] = useState(!!initial?.id);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleLabelChange = (v) => {
    set("field_label", v);
    if (!keyTouched) set("field_key", slugify(v));
  };

  const addOption = () => {
    const label = newOptionLabel.trim();
    if (!label) return;
    const value = slugify(label);
    set("field_options", [...form.field_options, { value, label }]);
    setNewOptionLabel("");
  };

  const removeOption = (idx) =>
    set("field_options", form.field_options.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.field_label.trim()) return toast.error("Le libellé est requis");
    if (!form.field_key.trim()) return toast.error("La clé est requise");
    if (form.field_type === "select" && form.field_options.length === 0)
      return toast.error("Ajoutez au moins une option pour ce type");
    onSave({ ...form, event_id: event.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Libellé *</Label>
          <Input
            value={form.field_label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Ex : Âge, Ville de résidence…"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">
            Clé technique *{" "}
            <span className="text-muted-foreground font-normal">(a-z 0-9 _)</span>
          </Label>
          <Input
            value={form.field_key}
            onChange={(e) => { setKeyTouched(true); set("field_key", e.target.value.replace(/[^a-z0-9_]/g, "")); }}
            placeholder="age, ville_residence…"
            disabled={!!initial?.id}
            className={initial?.id ? "bg-muted/40 cursor-not-allowed" : ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Type de champ</Label>
          <Select value={form.field_type} onValueChange={(v) => set("field_type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Placeholder (optionnel)</Label>
          <Input
            value={form.placeholder}
            onChange={(e) => set("placeholder", e.target.value)}
            placeholder="Texte indicatif…"
          />
        </div>
      </div>

      {form.field_type === "select" && (
        <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
          <Label className="text-xs font-semibold">Options de la liste</Label>
          <div className="space-y-1">
            {form.field_options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 px-2 py-1 rounded bg-background border text-foreground">{opt.label}</span>
                <span className="text-muted-foreground font-mono text-xs">{opt.value}</span>
                <button type="button" onClick={() => removeOption(i)} className="text-destructive hover:text-destructive/70">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newOptionLabel}
              onChange={(e) => setNewOptionLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
              placeholder="Libellé de l'option…"
              className="h-8 text-sm"
            />
            <Button type="button" size="sm" variant="outline" onClick={addOption} className="h-8 gap-1">
              <Plus className="w-3.5 h-3.5" />Ajouter
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch id="fld-required" checked={form.is_required} onCheckedChange={(v) => set("is_required", v)} />
          <Label htmlFor="fld-required" className="text-xs cursor-pointer">Obligatoire</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="fld-visible" checked={form.is_visible} onCheckedChange={(v) => set("is_visible", v)} />
          <Label htmlFor="fld-visible" className="text-xs cursor-pointer">Visible</Label>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Label className="text-xs">Ordre</Label>
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            className="h-8 w-16 text-center"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1 border-t">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Annuler</Button>
        <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5">
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {initial?.id ? "Mettre à jour" : "Créer le champ"}
        </Button>
      </div>
    </form>
  );
}

// Champs de base non supprimables — toujours présents, masquables sauf prénom/nom
const BASE_FIELDS = [
  { key: "email",  label: "Email",      configKey: "hide_email",  alwaysVisible: false },
  { key: "phone",  label: "Téléphone",  configKey: "hide_phone",  alwaysVisible: false },
  { key: "gender", label: "Genre",      configKey: "hide_gender", alwaysVisible: false },
];

export default function EventFormFieldsDialog({ open, onClose, event }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | "new" | fieldObject
  const queryKey = ["form-fields", event?.id];

  // Config locale pour les toggles de champs de base — se resynchronise à l'ouverture
  const [regConfig, setRegConfig] = useState(() => event?.registration_config || {});
  useEffect(() => {
    if (open) setRegConfig(event?.registration_config || {});
  }, [open, event?.id]);

  const { data: fields = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listFormFields(event.id, true),
    enabled: open && !!event?.id,
  });

  const configMut = useMutation({
    mutationFn: (config) => updateEvent(event.id, { registration_config: config }),
    onSuccess: () => {
      toast.success("Configuration enregistrée");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const toggleBaseField = (configKey) => {
    const next = { ...regConfig, [configKey]: !regConfig[configKey] };
    setRegConfig(next);
    configMut.mutate(next);
  };

  const createMut = useMutation({
    mutationFn: createFormField,
    onSuccess: () => {
      toast.success("Champ ajouté");
      qc.invalidateQueries({ queryKey });
      setEditing(null);
    },
    onError: (err) => toast.error(err?.message || "Erreur lors de la création"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateFormField(id, data),
    onSuccess: () => {
      toast.success("Champ mis à jour");
      qc.invalidateQueries({ queryKey });
      setEditing(null);
    },
    onError: (err) => toast.error(err?.message || "Erreur lors de la mise à jour"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteFormField,
    onSuccess: (_, id) => {
      toast.success("Champ supprimé");
      qc.setQueryData(queryKey, (prev = []) => prev.filter((f) => f.id !== id));
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const toggleVisible = (field) =>
    updateMut.mutate({ id: field.id, data: { is_visible: !field.is_visible } });

  const moveField = (field, direction) => {
    const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((f) => f.id === field.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapWith = sorted[swapIdx];
    updateMut.mutate({ id: field.id, data: { sort_order: swapWith.sort_order } });
    updateMut.mutate({ id: swapWith.id, data: { sort_order: field.sort_order } });
  };

  const handleSave = (data) => {
    if (editing?.id) {
      const { event_id, field_key, ...patchable } = data;
      updateMut.mutate({ id: editing.id, data: patchable });
    } else {
      createMut.mutate(data);
    }
  };

  const isMutating = createMut.isPending || updateMut.isPending;
  const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Champs du formulaire d'inscription
          </DialogTitle>
          <DialogDescription className="truncate">
            {event?.title} — configurez les informations supplémentaires à collecter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">

          {/* ── Champs de base (toujours présents, masquables) ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Champs de base
            </p>
            <div className="rounded-lg border border-border divide-y divide-border">
              {/* Prénom & Nom — toujours obligatoires */}
              {[{ label: "Prénom" }, { label: "Nom" }].map((f) => (
                <div key={f.label} className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <span className="text-sm font-medium">{f.label}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 text-red-600 border-red-200">
                      toujours visible
                    </Badge>
                  </div>
                  <Switch checked disabled className="opacity-50" />
                </div>
              ))}
              {/* Email, Téléphone, Genre — masquables */}
              {BASE_FIELDS.map((f) => {
                const isHidden = !!regConfig[f.configKey];
                return (
                  <div key={f.key} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{f.label}</span>
                      {isHidden && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">
                          masqué
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={!isHidden}
                      onCheckedChange={() => toggleBaseField(f.configKey)}
                      disabled={configMut.isPending}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Champs personnalisés ── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Champs personnalisés
            </p>
          {/* Field list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 && editing === null ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Aucun champ personnalisé pour cet événement.
              <br />Ajoutez des champs pour enrichir le formulaire d'inscription.
            </div>
          ) : (
            <div className="space-y-1.5">
              {sorted.map((field, idx) => (
                <div
                  key={field.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                    editing?.id === field.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:bg-muted/30"
                  }`}
                >
                  {/* Move buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveField(field, -1)}
                      disabled={idx === 0 || isMutating}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(field, 1)}
                      disabled={idx === sorted.length - 1 || isMutating}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Field info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{field.field_label}</span>
                      {field.is_required && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-red-600 border-red-300">obligatoire</Badge>
                      )}
                      {!field.is_visible && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">masqué</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground font-mono">{field.field_key}</span>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-xs text-muted-foreground">{TYPE_LABELS[field.field_type] || field.field_type}</span>
                      {field.field_type === "select" && field.field_options?.length > 0 && (
                        <span className="text-xs text-muted-foreground">({field.field_options.length} options)</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      title={field.is_visible ? "Masquer" : "Afficher"}
                      onClick={() => toggleVisible(field)}
                      disabled={isMutating}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {field.is_visible
                        ? <Eye className="w-3.5 h-3.5" />
                        : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      title="Modifier"
                      onClick={() => setEditing(editing?.id === field.id ? null : field)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={() => deleteMut.mutate(field.id)}
                      disabled={deleteMut.isPending}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline edit / create form */}
          {editing !== null && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mt-2">
              <p className="text-sm font-semibold mb-3">
                {editing === "new" ? "Nouveau champ" : `Modifier — ${editing.field_label}`}
              </p>
              <FieldForm
                event={event}
                initial={editing === "new" ? undefined : editing}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
                isSaving={isMutating}
              />
            </div>
          )}

          {/* Add button */}
          {editing === null && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={() => setEditing("new")}
            >
              <Plus className="w-4 h-4" />
              Ajouter un champ
            </Button>
          )}
          </div>{/* fin section champs personnalisés */}
        </div>{/* fin space-y-5 */}
      </DialogContent>
    </Dialog>
  );
}
