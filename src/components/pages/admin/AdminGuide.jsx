import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { HelpCircle, Plus, Pencil, Trash2, X, Eye, EyeOff, GripVertical, BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const authHeader = () => {
  const token = localStorage.getItem("eventflow_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiFetch = (path, opts = {}) =>
  fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader(), ...(opts.headers || {}) },
    ...opts,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || r.statusText);
    return data;
  });

const EMPTY = { question: "", answer: "", sort_order: 0, is_visible: true };

function FaqRow({ faq, onEdit, onToggle, onDelete }) {
  return (
    <div className={`border border-border/60 rounded-xl p-4 flex gap-3 transition-opacity ${!faq.is_visible ? "opacity-50" : ""}`}>
      <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start gap-2">
          <p className="font-medium text-sm flex-1">{faq.question}</p>
          <Badge variant="outline" className="text-[10px] shrink-0">#{faq.sort_order}</Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{faq.answer}</p>
        {!faq.is_visible && <Badge variant="secondary" className="text-[10px]">masqué</Badge>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="icon" variant="ghost" className="w-7 h-7" title={faq.is_visible ? "Masquer" : "Afficher"} onClick={() => onToggle(faq)}>
          {faq.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </Button>
        <Button size="icon" variant="ghost" className="w-7 h-7" title="Modifier" onClick={() => onEdit(faq)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="w-7 h-7 text-red-500 hover:text-red-600 hover:bg-red-50" title="Supprimer" onClick={() => onDelete(faq.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminGuide() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | faq object | "new"
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-guide-faqs"],
    queryFn: () => apiFetch("/guide-faqs?admin=true"),
    refetchOnMount: "always",
  });

  const startNew = () => {
    setForm({ ...EMPTY, sort_order: (faqs.length + 1) });
    setEditing("new");
  };

  const startEdit = (faq) => {
    setForm({
      question: faq.question,
      answer: faq.answer,
      sort_order: faq.sort_order,
      is_visible: faq.is_visible,
    });
    setEditing(faq);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("La question et la réponse sont obligatoires");
      return;
    }
    setSaving(true);
    try {
      if (editing === "new") {
        await apiFetch("/guide-faqs", {
          method: "POST",
          body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) }),
        });
        toast.success("FAQ ajoutée");
      } else {
        await apiFetch(`/guide-faqs/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) }),
        });
        toast.success("FAQ mise à jour");
      }
      qc.invalidateQueries({ queryKey: ["admin-guide-faqs"] });
      cancelEdit();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (faq) => {
    try {
      await apiFetch(`/guide-faqs/${faq.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_visible: !faq.is_visible }),
      });
      qc.invalidateQueries({ queryKey: ["admin-guide-faqs"] });
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette FAQ ?")) return;
    try {
      await apiFetch(`/guide-faqs/${id}`, { method: "DELETE" });
      toast.success("FAQ supprimée");
      qc.invalidateQueries({ queryKey: ["admin-guide-faqs"] });
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Guide d'utilisation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gérez les questions fréquentes affichées sur la page /guide
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/guide" target="_blank">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" /> Voir la page
            </Button>
          </Link>
          {!editing && (
            <Button className="gap-2" onClick={startNew}>
              <Plus className="w-4 h-4" /> Ajouter une FAQ
            </Button>
          )}
        </div>
      </div>

      {/* Form */}
      {editing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editing === "new" ? "Nouvelle question" : "Modifier la question"}
              </CardTitle>
              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="faq-q">Question <span className="text-red-500">*</span></Label>
              <Input
                id="faq-q"
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
                placeholder="Ex : Dois-je créer un compte pour m'inscrire ?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="faq-a">Réponse <span className="text-red-500">*</span></Label>
              <Textarea
                id="faq-a"
                value={form.answer}
                onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
                placeholder="Réponse claire et concise…"
                rows={4}
                className="resize-none"
              />
            </div>
            <div className="flex items-center gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="faq-order">Ordre</Label>
                <Input
                  id="faq-order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                  className="w-24"
                />
              </div>
              <div className="flex items-center gap-2 mt-5">
                <Switch
                  id="faq-visible"
                  checked={form.is_visible}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_visible: v }))}
                />
                <Label htmlFor="faq-visible" className="cursor-pointer">Visible</Label>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Sauvegarde…" : editing === "new" ? "Créer la FAQ" : "Enregistrer"}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ list */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Questions fréquentes ({faqs.length})
            </CardTitle>
            <Badge variant="secondary">
              {faqs.filter((f) => f.is_visible).length} visibles
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Chargement…</p>
          ) : faqs.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Aucune FAQ. Cliquez sur « Ajouter une FAQ ».</p>
            </div>
          ) : (
            faqs.map((faq) => (
              <FaqRow
                key={faq.id}
                faq={faq}
                onEdit={startEdit}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Info panel */}
      <Card className="border-border/50 bg-muted/20">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Contenu structurel du guide</strong> (étapes Participant, Organisateur, carte Fonctionnalités)
            est géré directement dans le code source. Seules les <strong>Questions fréquentes</strong> ci-dessus
            sont éditables depuis ce panneau et se reflètent en temps réel sur la page <Link to="/guide" className="text-primary underline">/guide</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
