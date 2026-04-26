import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAdminTestimonials, createTestimonial, updateTestimonial,
  toggleTestimonial, deleteTestimonial,
} from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Star, Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle, GripVertical } from "lucide-react";

const EMOJIS = ["🎤", "🎵", "💼", "🏆", "🎭", "📱", "🌍", "🎓", "💡", "🚀"];

const EMPTY = { name: "", role: "", city: "", emoji: "🎤", quote: "", stars: 5, is_active: true, sort_order: 0 };

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`w-5 h-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

function TestimonialCard({ t, onEdit, onToggle, onDelete, isUpdating }) {
  return (
    <Card className={`transition-opacity ${!t.is_active ? "opacity-50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0 mt-1">{t.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              {Array(t.stars).fill(0).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic leading-relaxed mb-3">"{t.quote}"</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{t.name}</p>
              <span className="text-muted-foreground text-xs">·</span>
              <p className="text-xs text-muted-foreground">{t.role}</p>
              {t.city && (
                <>
                  <span className="text-muted-foreground text-xs">·</span>
                  <Badge variant="outline" className="text-xs px-1.5 py-0">{t.city}</Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => onEdit(t)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="w-8 h-8"
              onClick={() => onToggle(t.id)}
              disabled={isUpdating}
              title={t.is_active ? "Masquer" : "Afficher"}
            >
              {t.is_active ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600" onClick={() => onDelete(t)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <GripVertical className="w-3 h-3" />Ordre : {t.sort_order}
          </span>
          <Badge className={t.is_active ? "bg-emerald-100 text-emerald-700 border-0 text-xs" : "bg-muted text-muted-foreground border-0 text-xs"}>
            {t.is_active ? "Visible" : "Masqué"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminTestimonials() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteDialog, setDeleteDialog] = useState(null);

  const { data: testimonials = [], isLoading, isError } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: listAdminTestimonials,
    staleTime: 30_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-testimonials"] });

  const createMut = useMutation({
    mutationFn: createTestimonial,
    onSuccess: () => { toast.success("Témoignage ajouté"); closeForm(); invalidate(); },
    onError: (e) => toast.error(e?.body?.error || "Erreur"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateTestimonial(id, data),
    onSuccess: () => { toast.success("Témoignage mis à jour"); closeForm(); invalidate(); },
    onError: (e) => toast.error(e?.body?.error || "Erreur"),
  });

  const toggleMut = useMutation({
    mutationFn: toggleTestimonial,
    onSuccess: invalidate,
    onError: () => toast.error("Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => { toast.success("Témoignage supprimé"); setDeleteDialog(null); invalidate(); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: testimonials.length + 1 });
    setFormOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, role: t.role, city: t.city || "", emoji: t.emoji || "🎤", quote: t.quote, stars: t.stars, is_active: t.is_active, sort_order: t.sort_order });
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setEditing(null); setForm(EMPTY); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Le nom est requis");
    if (!form.role.trim()) return toast.error("Le rôle est requis");
    if (!form.quote.trim() || form.quote.length < 10) return toast.error("Le témoignage doit faire au moins 10 caractères");
    const payload = { ...form, sort_order: Number(form.sort_order) || 0, stars: Number(form.stars) || 5 };
    if (editing) updateMut.mutate({ id: editing.id, data: payload });
    else createMut.mutate(payload);
  };

  const active = testimonials.filter((t) => t.is_active).length;
  const hidden = testimonials.filter((t) => !t.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Témoignages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les avis clients affichés sur la page d'accueil</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />Ajouter un témoignage
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-card border rounded-lg px-4 py-2.5 flex items-center gap-2">
          <span className="text-lg font-bold">{testimonials.length}</span>
          <span className="text-sm text-muted-foreground">total</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-600" />
          <span className="text-lg font-bold text-emerald-700">{active}</span>
          <span className="text-sm text-emerald-600">visibles</span>
        </div>
        <div className="bg-muted rounded-lg px-4 py-2.5 flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-muted-foreground" />
          <span className="text-lg font-bold">{hidden}</span>
          <span className="text-sm text-muted-foreground">masqués</span>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-16 text-destructive">
          <AlertCircle className="w-6 h-6" />
          <p className="text-sm">Impossible de charger les témoignages</p>
        </div>
      ) : testimonials.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Aucun témoignage</p>
            <p className="text-sm text-muted-foreground mb-4">Ajoutez des avis pour renforcer la confiance des visiteurs.</p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />Ajouter un témoignage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {testimonials.map((t) => (
            <TestimonialCard
              key={t.id}
              t={t}
              onEdit={openEdit}
              onToggle={(id) => toggleMut.mutate(id)}
              onDelete={setDeleteDialog}
              isUpdating={toggleMut.isPending}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le témoignage" : "Nouveau témoignage"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Amara Diallo" />
              </div>
              <div className="space-y-1">
                <Label>Ville</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Dakar" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Rôle / Fonction *</Label>
              <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Organisatrice formations" />
            </div>
            <div className="space-y-1">
              <Label>Témoignage *</Label>
              <Textarea
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                placeholder="EventFlow a transformé la façon dont nous gérons nos événements..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{form.quote.length}/500</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map((e) => (
                    <button
                      key={e} type="button"
                      onClick={() => setForm({ ...form, emoji: e })}
                      className={`text-xl px-1.5 py-0.5 rounded transition-colors ${form.emoji === e ? "bg-primary/15 ring-2 ring-primary" : "hover:bg-muted"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Note</Label>
                <StarPicker value={form.stars} onChange={(v) => setForm({ ...form, stars: v })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Ordre d'affichage</Label>
                <Input type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Visibilité</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <span className="text-sm text-muted-foreground">{form.is_active ? "Visible" : "Masqué"}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Annuler</Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                {editing ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le témoignage ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Le témoignage de <span className="font-medium">{deleteDialog?.name}</span> sera définitivement supprimé.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate(deleteDialog.id)} disabled={deleteMut.isPending}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
