import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { createEvent, updateEvent } from "@/api/eventsApi";
import { uploadImage } from "@/api/uploadApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  // Pour crop
  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);
  // Normalize date from DB ("2026-04-30 10:00:00" → "2026-04-30T10:00") for datetime-local inputs.
  const normDate = (d) => (d ? String(d).replace(" ", "T").slice(0, 16) : "");

  const [form, setForm] = useState(event ? {
    ...event,
    title: event.title || "",
    description: event.description || "",
    category: event.category || "autre",
    date_start: normDate(event.date_start),
    date_end: normDate(event.date_end),
    location_name: event.location_name || "",
    city: event.city || "",
    address: event.address || "",
    max_participants: event.max_participants ?? "",
    price: event.price ?? "",
    status: event.status || "brouillon",
    tags: event.tags || "",
    image_url: event.image_url || "",
  } : {
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
    const localUrl = URL.createObjectURL(file);
    setRawImage(localUrl);
    setShowCropper(true);
  };

  const handleCropConfirm = async () => {
    setImageUploading(true);
    try {
      const croppedBlob = await getCroppedImg(rawImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" });
      const fileUrl = await uploadImage(croppedFile);
      setForm((prev) => ({ ...prev, image_url: fileUrl }));
      setImagePreview(fileUrl);
      setShowCropper(false);
    } catch (err) {
      toast.error("Erreur lors du recadrage de l'image.");
    }
    setImageUploading(false);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setForm((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation manuelle des champs obligatoires
    if (!form.title.trim()) {
      toast.error("Le titre de l'événement est obligatoire.");
      return;
    }
    if (!form.category) {
      toast.error("La catégorie est obligatoire.");
      return;
    }
    if (!form.date_start) {
      toast.error("La date de début est obligatoire.");
      return;
    }
    if (!form.city.trim()) {
      toast.error("La ville est obligatoire.");
      return;
    }
    setLoading(true);
    const data = {
      ...form,
      max_participants: form.max_participants ? Number(form.max_participants) : undefined,
      price: form.price ? Number(form.price) : 0,
      date_end: form.date_end || undefined,
    };

    try {
      if (isEdit) {
        await updateEvent(event.id, data);
        toast.success("Événement mis à jour !");
      } else {
        await createEvent(data);
        toast.success("Événement créé !");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["featured-events"] });
      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      toast.error("Erreur lors de la création ou modification de l'événement.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
          <DialogDescription>
            Renseignez les informations de l'evenement puis validez pour enregistrer les changements.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              <Input type="datetime-local" required value={form.date_start} onChange={(e) => handleChange("date_start", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date de fin</Label>
              <Input type="datetime-local" value={form.date_end} onChange={(e) => handleChange("date_end", e.target.value)} />
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
            <div className="text-xs text-muted-foreground mt-1">
              <span>📏 Taille recommandée : <b>1200×630px</b> (format paysage).<br />
              L'image sera automatiquement redimensionnée. Vous pouvez recadrer l'image avant l'envoi.</span>
            </div>
            {showCropper && (
              <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-[90vw] max-w-xl flex flex-col overflow-hidden" style={{ height: "min(90vh, 480px)" }}>
                  <div className="p-4 border-b border-border">
                    <p className="font-semibold text-sm">Recadrer l'image</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Format recommandé : 1200×630 px (paysage)</p>
                  </div>
                  <div className="relative flex-1">
                    <Cropper
                      image={rawImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1200/630}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                  <div className="flex justify-end gap-2 p-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowCropper(false);
                      setRawImage(null);
                    }}>Annuler</Button>
                    <Button type="button" onClick={handleCropConfirm} disabled={imageUploading}>
                      {imageUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Recadrer
                    </Button>
                  </div>
                </div>
              </div>
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