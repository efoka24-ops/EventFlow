import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAdminCategories, createCategory, updateCategory, deleteCategory } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tag, Plus, Pencil, Trash2, GripVertical } from "lucide-react";

const ICON_OPTIONS = [
  "Music", "Trophy", "Briefcase", "Palette", "Cpu", "UtensilsCrossed",
  "GraduationCap", "Sparkles", "Heart", "Star", "Zap", "Globe",
];

const COLOR_OPTIONS = [
  "#8b5cf6", "#10b981", "#3b82f6", "#ec4899", "#f59e0b",
  "#ef4444", "#06b6d4", "#f97316", "#84cc16", "#6b7280",
];

function CategoryForm({ initial, onSave, onCancel, isLoading }) {
  const [form, setForm] = useState(initial || {
    name: "", slug: "", description: "", icon: "Star", color: "#6b7280", sort_order: 0,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleName = (name) => {
    set("name", name);
    if (!initial) set("slug", name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Nom *</Label>
          <Input value={form.name} onChange={(e) => handleName(e.target.value)} placeholder="Ex: Musique" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Slug *</Label>
          <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="musique" className="mt-1" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Description</Label>
        <Input value={form.description || ""} onChange={(e) => set("description", e.target.value)} placeholder="Description courte" className="mt-1" />
      </div>
      <div>
        <Label className="text-xs mb-2 block">Couleur</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("color", c)}
              className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs">Ordre d'affichage</Label>
        <Input type="number" value={form.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value))} className="mt-1 w-24" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={() => onSave(form)} disabled={isLoading || !form.name || !form.slug}>
          {initial ? "Mettre à jour" : "Créer la catégorie"}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: listAdminCategories,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-categories"] });

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { toast.success("Catégorie créée"); setCreateOpen(false); invalidate(); },
    onError: (e) => toast.error(e.body?.error || "Erreur lors de la création"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => { toast.success("Catégorie mise à jour"); setEditItem(null); invalidate(); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => updateCategory(id, { is_active }),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => { toast.success("Catégorie supprimée"); setDeleteItem(null); invalidate(); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catégories d'événements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les catégories disponibles sur la plateforme</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />Nouvelle catégorie
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">Chargement...</div>
        ) : categories.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">Aucune catégorie</div>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id} className={`transition-opacity ${cat.is_active ? "" : "opacity-50"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                      <Tag className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                    </div>
                  </div>
                  <Switch
                    checked={cat.is_active}
                    onCheckedChange={(v) => toggleMut.mutate({ id: cat.id, is_active: v })}
                    className="shrink-0"
                  />
                </div>
                {cat.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cat.description}</p>
                )}
                <div className="flex items-center gap-1 mt-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-muted-foreground flex-1">Ordre: {cat.sort_order}</span>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setEditItem(cat)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 hover:text-red-700" onClick={() => setDeleteItem(cat)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle catégorie</DialogTitle></DialogHeader>
          <CategoryForm
            onSave={(data) => createMut.mutate(data)}
            onCancel={() => setCreateOpen(false)}
            isLoading={createMut.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifier {editItem?.name}</DialogTitle></DialogHeader>
          <CategoryForm
            initial={editItem}
            onSave={(data) => updateMut.mutate({ id: editItem.id, data })}
            onCancel={() => setEditItem(null)}
            isLoading={updateMut.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer {deleteItem?.name} ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette catégorie sera définitivement supprimée. Les événements associés ne seront pas affectés.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate(deleteItem.id)} disabled={deleteMut.isPending}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
