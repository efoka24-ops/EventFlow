import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  clearCreatorAccountId,
  clearCreatorIdentity,
  getCreatorAccountId,
  normalizeEmail,
  normalizeIdentifier,
  normalizePhone,
  setCreatorIdentity,
  setCreatorAccountId,
} from "@/lib/creatorSession";
import { trackUserAction } from "@/lib/trackUserAction";

export default function SubmitEvent() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [creatorAccountId, setCreatorAccountIdState] = useState(getCreatorAccountId());
  const [activeCreatorAccount, setActiveCreatorAccount] = useState(null);

  const { data: creatorAccounts = [], isLoading: isLoadingCreatorAccounts } = useQuery({
    queryKey: ["creator-accounts"],
    queryFn: () => base44.entities.CreatorAccount.list("-created_date"),
    refetchOnMount: "always",
  });

  const creatorAccount =
    activeCreatorAccount || creatorAccounts.find((item) => item.id === creatorAccountId) || null;

  useEffect(() => {
    if (!creatorAccountId || creatorAccounts.length === 0) return;
    const matched = creatorAccounts.find((item) => item.id === creatorAccountId);
    if (matched) setActiveCreatorAccount(matched);
  }, [creatorAccountId, creatorAccounts]);

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

  const hydrateOrganizerFromAccount = (account) => {
    setForm((prev) => ({
      ...prev,
      organizer_name: account.full_name || prev.organizer_name,
      organizer_email: account.email || prev.organizer_email,
      organizer_phone: account.phone || prev.organizer_phone,
    }));
  };

  const handleLogin = () => {
    if (isLoadingCreatorAccounts) {
      toast.error("Chargement des comptes en cours, réessayez dans un instant.");
      return;
    }

    const identifier = normalizeIdentifier(loginIdentifier);
    const password = String(loginPassword || "").trim();
    if (!identifier || !password) {
      toast.error("Identifiant et mot de passe requis.");
      return;
    }

    const account = creatorAccounts.find(
      (item) => (item.email === identifier || item.phone === identifier) && String(item.password || "") === password
    );

    if (!account) {
      toast.error("Compte introuvable ou mot de passe incorrect.");
      return;
    }

    setCreatorAccountId(account.id);
    setCreatorAccountIdState(account.id);
    setActiveCreatorAccount(account);
    setCreatorIdentity({ email: account.email, phone: account.phone });
    hydrateOrganizerFromAccount(account);
    trackUserAction({ action: "creator_account_login", user_email: account.email || null, context: "submit_event" });
    toast.success("Connexion réussie. Vous pouvez maintenant créer un événement.");
  };

  const handleSignup = async () => {
    const email = normalizeEmail(signupEmail);
    const phone = normalizePhone(signupPhone);

    if (!signupName.trim()) {
      toast.error("Le nom est obligatoire.");
      return;
    }
    if (!email && !phone) {
      toast.error("Renseignez un email ou un numéro de téléphone.");
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      toast.error("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    try {
      const account = await base44.entities.CreatorAccount.create({
        full_name: signupName.trim(),
        email: email || "",
        phone: phone || "",
        password: String(signupPassword).trim(),
      });

      queryClient.setQueryData(["creator-accounts"], (prev = []) => [account, ...prev]);
      setCreatorAccountId(account.id);
      setCreatorAccountIdState(account.id);
      setActiveCreatorAccount(account);
      setCreatorIdentity({ email: account.email, phone: account.phone });
      hydrateOrganizerFromAccount(account);
      trackUserAction({ action: "creator_account_created", user_email: account.email || null, context: "submit_event" });
      toast.success("Compte créé avec succès. Vous pouvez maintenant créer un événement.");
    } catch {
      toast.error("Impossible de créer ce compte (email/téléphone peut être déjà utilisé).");
    }
  };

  const handleLogout = () => {
    clearCreatorAccountId();
    clearCreatorIdentity();
    setCreatorAccountIdState("");
    setActiveCreatorAccount(null);
    setForm((prev) => ({ ...prev, organizer_name: "", organizer_email: "", organizer_phone: "" }));
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
        organizer_name: creatorAccount?.full_name || form.organizer_name,
        organizer_email: creatorAccount?.email || form.organizer_email.trim().toLowerCase(),
        organizer_phone: creatorAccount?.phone || form.organizer_phone || undefined,
      });

      trackUserAction({
        action: "event_created_by_user",
        user_email: creatorAccount?.email || form.organizer_email.trim().toLowerCase(),
        event_title: form.title,
        event_category: form.category,
        context: "submit_event",
        metadata: {
          city: form.city,
          date_start: form.date_start,
          max_participants: form.max_participants ? Number(form.max_participants) : null,
        },
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
          Vous devez avoir un compte (email ou téléphone) et vous connecter avant de créer un événement.
        </p>
      </div>

      {!creatorAccount ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant={authMode === "login" ? "default" : "outline"} onClick={() => setAuthMode("login")}>Se connecter</Button>
              <Button variant={authMode === "signup" ? "default" : "outline"} onClick={() => setAuthMode("signup")}>Créer un compte</Button>
            </div>

            {authMode === "login" ? (
              <div className="space-y-2">
                <Input
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Email ou téléphone"
                />
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Mot de passe"
                />
                <Button onClick={handleLogin}>Connexion</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Nom complet" />
                <Input value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="Email (optionnel)" />
                <Input value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder="Téléphone (optionnel)" />
                <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Mot de passe" />
                <Button onClick={handleSignup}>Créer le compte</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Connecté en tant que</p>
              <p className="font-semibold">{creatorAccount.full_name}</p>
              <p className="text-xs text-muted-foreground">{creatorAccount.email || creatorAccount.phone}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>Se déconnecter</Button>
          </CardContent>
        </Card>
      )}

      {creatorAccount ? (
        <Card>
          <CardHeader>
            <CardTitle>Formulaire de soumission</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Nom organisateur *</Label>
                <Input required value={form.organizer_name} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Email organisateur</Label>
                <Input type="email" value={form.organizer_email} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Téléphone</Label>
                <Input type="tel" value={form.organizer_phone} readOnly className="bg-muted/50" />
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
                <Button type="submit" disabled={!creatorAccount || loading || imageUploading} className="min-w-52">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Soumettre mon événement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
