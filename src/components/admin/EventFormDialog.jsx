import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function EventFormDialog({ open, onClose, event }) {
  const isEdit = !!event;
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(event?.image_url || null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(event || {
    title: "",
    description: "",
    category: "autre",
    date_start: "",
    date_end: "",
    location_name: "",
    city: "",
    address: "",
    max_participants: "",
    price: "",
    status: "brouillon",
    tags: "",
    image_url: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    // Upload to server
    setImageUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, image_url: file_url }));
    setImagePreview(file_url);
    setImageUploading(false);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setForm((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = {
      ...form,
      max_participants: form.max_participants ? Number(form.max_participants) : undefined,
      price: form.price ? Number(form.price) : 0,
    };

    if (isEdit) {
      await base44.entities.Event.update(event.id, data);
      toast.success("Événement mis à jour !");
    } else {
      await base44.entities.Event.create(data);
      toast.success("Événement créé !");
    }
    queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
    queryClient.invalidateQueries({ queryKey: ["featured-events"] });
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Titre *</Label>
            <Input required value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Catégorie *</Label>
              <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="publie">Publié</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date de début *</Label>
              <Input type="datetime-local" required value={form.date_start?.slice(0, 16)} onChange={(e) => handleChange("date_start", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date de fin</Label>
              <Input type="datetime-local" value={form.date_end?.slice(0, 16) || ""} onChange={(e) => handleChange("date_end", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nom du lieu</Label>
              <Input value={form.location_name} onChange={(e) => handleChange("location_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ville *</Label>
              <Input required value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Max. participants</Label>
              <Input type="number" value={form.max_participants} onChange={(e) => handleChange("max_participants", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prix (FCFA)</Label>
              <Input type="number" value={form.price} onChange={(e) => handleChange("price", e.target.value)} placeholder="0 = gratuit" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Image de l'événement</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden h-40 border border-border">
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                {imageUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all bg-muted/30"
              >
                <ImagePlus className="w-7 h-7" />
                <span className="text-sm font-medium">Cliquez pour sélectionner une image</span>
                <span className="text-xs">PNG, JPG, WEBP — depuis votre ordinateur</span>
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Tags (séparés par virgules)</Label>
            <Input value={form.tags} onChange={(e) => handleChange("tags", e.target.value)} placeholder="musique, live, été" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isEdit ? "Mettre à jour" : "Créer l'événement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}