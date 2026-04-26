import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { creatorLogin, creatorSignup } from "@/api/authApi";
import { createEvent } from "@/api/eventsApi";
import { uploadImage } from "@/api/uploadApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";
import {
  Loader2, ImagePlus, X, CheckCircle2, LogOut,
  LayoutDashboard, CalendarDays, ArrowRight, User, Plus
} from "lucide-react";
import { toast } from "sonner";
import {
  getCreatorUser, getCreatorEmail, getCreatorPhone,
  clearCreatorSession, normalizeEmail, normalizePhone, normalizeIdentifier,
} from "@/lib/creatorSession";
import { trackUserAction } from "@/lib/trackUserAction";

// ── Organizer onboarding steps ─────────────────────────────────────────────
const ONBOARDING_STEPS = [
  { key: "auth", label: "Votre compte" },
  { key: "create", label: "Créer l'événement" },
  { key: "done", label: "Espace organisateur" },
];

function OrganizerSteps({ currentStep }) {
  const activeIndex = ONBOARDING_STEPS.findIndex((s) => s.key === currentStep);
  return (
    <div className="flex items-center w-full">
      {ONBOARDING_STEPS.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={[
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                isDone ? "bg-emerald-500 border-emerald-500 text-white"
                  : isActive ? "bg-primary border-primary text-primary-foreground"
                    : "bg-muted border-border text-muted-foreground",
              ].join(" ")}>
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <span>{index + 1}</span>}
              </div>
              <span className={[
                "text-xs font-medium whitespace-nowrap",
                isActive ? "text-primary" : isDone ? "text-emerald-600" : "text-muted-foreground",
              ].join(" ")}>{step.label}</span>
            </div>
            {index < ONBOARDING_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full" style={{
                background: index < activeIndex ? "hsl(var(--primary))" : "hsl(var(--border))",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Empty form ─────────────────────────────────────────────────────────────
const emptyForm = {
  organizer_name: "", organizer_email: "", organizer_phone: "",
  title: "", description: "", category: "autre",
  date_start: "", date_end: "", location_name: "", city: "",
  address: "", max_participants: "", price: "", tags: "", image_url: "",
};

export default function SubmitEvent() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [authMode, setAuthMode] = useState(() => {
    const auth = new URLSearchParams(location.search).get("auth");
    return auth === "signup" ? "signup" : "login";
  });
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [creatorAccount, setCreatorAccount] = useState(() => getCreatorUser());
  const [form, setForm] = useState(emptyForm);
  const [eventCreated, setEventCreated] = useState(null);

  useEffect(() => {
    const sessionUser = getCreatorUser();
    if (!sessionUser) return;
    setCreatorAccount(sessionUser);
    setForm((prev) => ({
      ...prev,
      organizer_email: sessionUser.email || prev.organizer_email,
      organizer_phone: sessionUser.phone || prev.organizer_phone,
    }));
  }, []);

  const currentStep = !creatorAccount ? "auth" : !eventCreated ? "create" : "done";

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const applyAccount = (user) => {
    setCreatorAccount(user);
    setForm((prev) => ({
      ...prev,
      organizer_name: user.full_name || prev.organizer_name,
      organizer_email: user.email || prev.organizer_email,
      organizer_phone: user.phone || prev.organizer_phone,
    }));
  };

  const handleLogin = async () => {
    const identifier = normalizeIdentifier(loginIdentifier);
    const password = String(loginPassword || "").trim();
    if (!identifier || !password) { toast.error("Identifiant et mot de passe requis."); return; }
    try {
      const { user } = await creatorLogin({ identifier, password });
      applyAccount(user);
      trackUserAction({ action: "creator_account_login", user_email: user.email || null, context: "submit_event" });
      toast.success("Connexion réussie !");
      navigate("/dashboard");
    } catch {
      toast.error("Compte introuvable ou mot de passe incorrect.");
    }
  };

  const handleSignup = async () => {
    const email = normalizeEmail(signupEmail);
    const phone = normalizePhone(signupPhone);
    if (!signupName.trim()) { toast.error("Le nom est obligatoire."); return; }
    if (!email && !phone) { toast.error("Renseignez un email ou un numéro de téléphone."); return; }
    if (!signupPassword || signupPassword.length < 4) { toast.error("Mot de passe de 4 caractères minimum."); return; }
    try {
      const { user } = await creatorSignup({
        full_name: signupName.trim(),
        email: email || "",
        phone: phone || "",
        password: signupPassword.trim(),
      });
      applyAccount(user);
      trackUserAction({ action: "creator_account_created", user_email: user.email || null, context: "submit_event" });
      toast.success("Compte créé avec succès !");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.message?.includes("already") ? "Email ou téléphone déjà utilisé." : "Impossible de créer ce compte.");
    }
  };

  const handleLogout = () => {
    clearCreatorSession();
    setCreatorAccount(null);
    setEventCreated(null);
    setForm((prev) => ({ ...prev, organizer_name: "", organizer_email: "", organizer_phone: "" }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      setImageUploading(true);
      const fileUrl = await uploadImage(file);
      handleChange("image_url", fileUrl);
      setImagePreview(fileUrl);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await createEvent({
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
        organizer_email: form.organizer_email,
        organizer_phone: form.organizer_phone || undefined,
      });

      trackUserAction({
        action: "event_created_by_user",
        user_email: form.organizer_email || null,
        event_title: form.title,
        event_category: form.category,
        context: "submit_event",
        metadata: { city: form.city, date_start: form.date_start },
      });

      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["featured-events"] });
      queryClient.invalidateQueries({ queryKey: ["user-events-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });

      setEventCreated(created || { title: form.title });
      toast.success("Événement publié avec succès !");
    } catch {
      toast.error("Impossible de soumettre votre événement pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2">Proposer un événement</h1>
        <p className="text-muted-foreground">
          Créez et publiez votre événement en quelques minutes — mobile-first, paiement Mobile Money inclus.
        </p>
      </div>

      {/* Onboarding step tracker */}
      <div className="mb-8 p-5 rounded-2xl bg-muted/40 border border-border/50">
        <OrganizerSteps currentStep={currentStep} />
      </div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1 : Auth ─────────────────────────────────────────────── */}
        {currentStep === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Votre compte organisateur
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous ou créez un compte pour proposer et gérer vos événements.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Tab switch */}
                <div className="flex p-1 rounded-full bg-muted gap-1 w-fit">
                  <button
                    onClick={() => setAuthMode("login")}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${authMode === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => setAuthMode("signup")}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${authMode === "signup" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Créer un compte
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {authMode === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      className="space-y-3"
                    >
                      <div className="space-y-1.5">
                        <Label>Email ou téléphone</Label>
                        <Input
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="vous@email.com ou +237 6XX XX XX"
                          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Mot de passe</Label>
                        <Input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                      </div>
                      <Button onClick={handleLogin} className="w-full rounded-full gap-2">
                        Se connecter <ArrowRight className="w-4 h-4" />
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Pas encore de compte ?{" "}
                        <button onClick={() => setAuthMode("signup")} className="text-primary hover:underline font-medium">
                          Créer un compte gratuitement
                        </button>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="space-y-3"
                    >
                      <div className="space-y-1.5">
                        <Label>Nom complet *</Label>
                        <Input
                          value={signupName}
                          onChange={(e) => setSignupName(e.target.value)}
                          placeholder="Aminata Diallo"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="vous@email.com"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Téléphone</Label>
                          <Input
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="+237 6XX XX XX XX"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground -mt-1">Au moins un email ou un téléphone requis.</p>
                      <div className="space-y-1.5">
                        <Label>Mot de passe * (min. 4 caractères)</Label>
                        <Input
                          type="password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <Button onClick={handleSignup} className="w-full rounded-full gap-2">
                        Créer mon compte <ArrowRight className="w-4 h-4" />
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        Déjà un compte ?{" "}
                        <button onClick={() => setAuthMode("login")} className="text-primary hover:underline font-medium">
                          Se connecter
                        </button>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Benefits strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: CalendarDays, title: "Publiez en 5 min", desc: "Formulaire guidé, rapide et intuitif." },
                { icon: LayoutDashboard, title: "Dashboard dédié", desc: "Gérez inscriptions, revenus, statistiques." },
                { icon: CheckCircle2, title: "Paiement intégré", desc: "MTN MoMo, Orange Money, Wave." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/40">
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2 : Create event ──────────────────────────────────────── */}
        {currentStep === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            {/* Account banner */}
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Connecté en tant que organisateur</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{creatorAccount?.full_name} · {creatorAccount?.email || creatorAccount?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-full text-xs border-emerald-300 dark:border-emerald-700">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Mon espace
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs rounded-full">
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Form */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Détails de l'événement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Organizer info (read-only) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nom organisateur</Label>
                      <Input value={form.organizer_name} readOnly className="bg-muted/50 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" value={form.organizer_email} readOnly className="bg-muted/50 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Téléphone</Label>
                      <Input value={form.organizer_phone} readOnly className="bg-muted/50 text-sm" />
                    </div>
                  </div>

                  <hr className="border-border/40" />

                  <div className="space-y-1.5">
                    <Label>Titre de l'événement *</Label>
                    <Input required placeholder="Ex: Conférence Tech Africa 2025" value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Description *</Label>
                    <Textarea required rows={4} placeholder="Décrivez votre événement, le programme, les intervenants..." value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Catégorie *</Label>
                      <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (<SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ville *</Label>
                      <Input required placeholder="Douala, Yaoundé, Dakar..." value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
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
                      <Input placeholder="Salle des fêtes, Palais des congrès..." value={form.location_name} onChange={(e) => handleChange("location_name", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Adresse</Label>
                      <Input placeholder="Rue, quartier..." value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Places max.</Label>
                      <Input type="number" min="1" placeholder="Illimité si vide" value={form.max_participants} onChange={(e) => handleChange("max_participants", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Prix (FCFA)</Label>
                      <Input type="number" min="0" placeholder="0 = gratuit" value={form.price} onChange={(e) => handleChange("price", e.target.value)} />
                    </div>
                  </div>

                  {/* Image upload */}
                  <div className="space-y-1.5">
                    <Label>Image de couverture</Label>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden h-48 border border-border">
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
                        className="w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all bg-muted/20"
                      >
                        <ImagePlus className="w-6 h-6" />
                        <span className="text-sm font-medium">Cliquez pour ajouter une image</span>
                        <span className="text-xs">JPG, PNG, WEBP — recommandé 1200×630px</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Tags (séparés par virgules)</Label>
                    <Input placeholder="formation, jeunesse, tech, emploi" value={form.tags} onChange={(e) => handleChange("tags", e.target.value)} />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={loading || imageUploading} className="min-w-52 rounded-full gap-2">
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Publication en cours..." : "Publier mon événement"}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 3 : Done — Espace organisateur ───────────────────────── */}
        {currentStep === "done" && (
          <motion.div
            key="done"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            {/* Success */}
            <Card className="border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold mb-1">Événement publié !</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    <strong>{eventCreated?.title || "Votre événement"}</strong> est maintenant visible sur la plateforme. Gérez-le depuis votre espace organisateur.
                  </p>
                </div>
                <Badge className="bg-emerald-500 text-white border-0 px-4 py-1">En ligne maintenant</Badge>
              </CardContent>
            </Card>

            {/* CTA cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/dashboard/events" className="block">
                <div className="h-full p-5 rounded-2xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all cursor-pointer group">
                  <LayoutDashboard className="w-6 h-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-bold text-sm mb-1">Mon espace organisateur</p>
                  <p className="text-xs text-muted-foreground">Gérez inscriptions, revenus et statistiques.</p>
                  <ArrowRight className="w-4 h-4 text-primary mt-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link to="/events" className="block">
                <div className="h-full p-5 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group">
                  <CalendarDays className="w-6 h-6 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                  <p className="font-bold text-sm mb-1">Voir mon événement</p>
                  <p className="text-xs text-muted-foreground">Prévisualiser la page publique de l'événement.</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>

              <button onClick={() => { setEventCreated(null); setForm({ ...emptyForm, organizer_name: creatorAccount?.full_name || "", organizer_email: getCreatorEmail(), organizer_phone: getCreatorPhone() }); setImagePreview(null); }} className="text-left">
                <div className="h-full p-5 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group">
                  <Plus className="w-6 h-6 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                  <p className="font-bold text-sm mb-1">Créer un autre événement</p>
                  <p className="text-xs text-muted-foreground">Publiez un nouvel événement immédiatement.</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
