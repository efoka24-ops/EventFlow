import React, { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";
import { Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

export default function SubmitEvent() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    organizer_name: "",
    organizer_email: "",
    organizer_phone: "",
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
    tags: "",
    image_url: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      setImageUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleChange("image_url", file_url);
      setImagePreview(file_url);
    } catch {
      toast.error("Impossible d'ajouter l'image pour le moment.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    handleChange("image_url", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setForm({
      organizer_name: "",
      organizer_email: "",
      organizer_phone: "",
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
      tags: "",
      image_url: "",
    });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.Event.create({
        title: form.title,
        description: form.description,
        category: form.category,
        date_start: form.date_start,
        date_end: form.date_end || undefined,
        location_name: form.location_name || undefined,
        city: form.city,
        address: form.address || undefined,
        max_participants: form.max_participants ? Number(form.max_participants) : undefined,
        price: form.price ? Number(form.price) : 0,
        tags: form.tags,
        image_url: form.image_url || "",
        status: "publie",
        submitted_by_user: true,
        organizer_name: form.organizer_name,
        organizer_email: form.organizer_email.trim().toLowerCase(),
        organizer_phone: form.organizer_phone || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["featured-events"] });
      toast.success("Événement publié avec succès.");
      resetForm();
    } catch {
      toast.error("Impossible de soumettre votre événement pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Proposer un événement</h1>
        <p className="text-muted-foreground">
          Créez votre événement. Il sera publié automatiquement dès la soumission.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire de soumission</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Nom organisateur *</Label>
                <Input required value={form.organizer_name} onChange={(e) => handleChange("organizer_name", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Email organisateur *</Label>
                <Input required type="email" value={form.organizer_email} onChange={(e) => handleChange("organizer_email", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Téléphone</Label>
                <Input type="tel" value={form.organizer_phone} onChange={(e) => handleChange("organizer_phone", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Titre *</Label>
              <Input required value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea required rows={4} value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <Label>Ville *</Label>
                <Input required value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date de début *</Label>
                <Input type="datetime-local" required value={form.date_start} onChange={(e) => handleChange("date_start", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Date de fin</Label>
                <Input type="datetime-local" value={form.date_end} onChange={(e) => handleChange("date_end", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom du lieu</Label>
                <Input value={form.location_name} onChange={(e) => handleChange("location_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Label>Image</Label>
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
                  className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all bg-muted/30"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-sm font-medium">Ajouter une image</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tags (séparés par virgules)</Label>
              <Input value={form.tags} onChange={(e) => handleChange("tags", e.target.value)} placeholder="formation, jeunesse, emploi" />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading || imageUploading} className="min-w-52">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Soumettre mon événement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
