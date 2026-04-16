import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";

const initialForm = {
  topic_id: "",
  topic_title: "",
  topic_description: "",
  topic_order: 1,
  title: "",
  content: "",
  article_order: 1,
};

export default function AdminHelp() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["admin-help-articles"],
    queryFn: () => base44.entities.HelpArticle.list("topic_order"),
    refetchOnMount: "always",
  });

  const grouped = useMemo(() => {
    const map = new Map();
    articles.forEach((article) => {
      const key = article.topic_id || "general";
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          title: article.topic_title || "Général",
          description: article.topic_description || "",
          topic_order: Number(article.topic_order || 0),
          items: [],
        });
      }
      map.get(key).items.push(article);
    });
    return Array.from(map.values())
      .sort((a, b) => a.topic_order - b.topic_order)
      .map((topic) => ({
        ...topic,
        items: [...topic.items].sort(
          (a, b) => Number(a.article_order || 0) - Number(b.article_order || 0)
        ),
      }));
  }, [articles]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const startEdit = (article) => {
    setEditingId(article.id);
    setForm({
      topic_id: article.topic_id || "",
      topic_title: article.topic_title || "",
      topic_description: article.topic_description || "",
      topic_order: Number(article.topic_order || 1),
      title: article.title || "",
      content: article.content || "",
      article_order: Number(article.article_order || 1),
    });
  };

  const refreshQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-help-articles"] });
    queryClient.invalidateQueries({ queryKey: ["help-articles"] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        topic_id: form.topic_id.trim().toLowerCase().replace(/\s+/g, "-") || "general",
        topic_title: form.topic_title.trim() || "Général",
        topic_description: form.topic_description.trim(),
        topic_order: Number(form.topic_order || 1),
        title: form.title.trim(),
        content: form.content.trim(),
        article_order: Number(form.article_order || 1),
      };

      if (!payload.title || !payload.content) {
        toast.error("Le titre et le contenu de l'article sont obligatoires.");
        return;
      }

      if (editingId) {
        await base44.entities.HelpArticle.update(editingId, payload);
        toast.success("Article d'aide mis à jour");
      } else {
        await base44.entities.HelpArticle.create(payload);
        toast.success("Article d'aide ajouté");
      }

      refreshQueries();
      resetForm();
    } catch {
      toast.error("Impossible d'enregistrer cet article");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.HelpArticle.delete(id);
      refreshQueries();
      toast.success("Article supprimé");
      if (editingId === id) resetForm();
    } catch {
      toast.error("Suppression impossible");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion de l'aide</h1>
        <p className="text-sm text-muted-foreground">Administrez les sujets et articles affichés sur la page Aide.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Modifier un article" : "Ajouter un article"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code sujet</Label>
                <Input value={form.topic_id} onChange={(e) => handleChange("topic_id", e.target.value)} placeholder="ex: inscription" />
              </div>
              <div className="space-y-1.5">
                <Label>Titre sujet *</Label>
                <Input required value={form.topic_title} onChange={(e) => handleChange("topic_title", e.target.value)} placeholder="Inscription et billets" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description sujet</Label>
              <Input value={form.topic_description} onChange={(e) => handleChange("topic_description", e.target.value)} placeholder="Description courte du sujet" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Titre article *</Label>
                <Input required value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ordre article</Label>
                <Input type="number" value={form.article_order} onChange={(e) => handleChange("article_order", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Contenu *</Label>
              <Textarea required rows={5} value={form.content} onChange={(e) => handleChange("content", e.target.value)} />
            </div>

            <div className="space-y-1.5 md:max-w-xs">
              <Label>Ordre sujet</Label>
              <Input type="number" value={form.topic_order} onChange={(e) => handleChange("topic_order", e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={saving} className="gap-2">
                <Plus className="w-4 h-4" />
                {editingId ? "Mettre à jour" : "Ajouter"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
                  <X className="w-4 h-4" /> Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Chargement des articles...</CardContent>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Aucun article d'aide pour le moment.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((topic) => (
            <Card key={topic.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {topic.title}
                  <Badge variant="outline">{topic.items.length} article(s)</Badge>
                </CardTitle>
                {topic.description && <p className="text-sm text-muted-foreground">{topic.description}</p>}
              </CardHeader>
              <CardContent className="space-y-3">
                {topic.items.map((article) => (
                  <div key={article.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{article.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{article.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(article)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(article.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
