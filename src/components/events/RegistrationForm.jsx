import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, FileText, Loader2, CheckCircle2, User, Download, Smartphone, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { generateTicketPDF } from "@/utils/generateTicket";
import { normalizeParticipantEmail, setParticipantEmail } from "@/lib/participantSession";
import { trackUserAction } from "@/lib/trackUserAction";

const isGmailEmail = (email) => /@gmail\.com$/i.test((email || "").trim());

const detectEmailProvider = (email) => {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized.includes("@")) return null;
  return normalized.split("@")[1] || null;
};

const reverseGeocode = async (latitude, longitude) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const data = await response.json();
  const address = data.address || {};
  return {
    label: data.display_name || null,
    city: address.city || address.town || address.village || address.county || null,
    region: address.state || null,
    country: address.country || null,
  };
};

export default function RegistrationForm({ event, onSuccess }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [method, setMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedRegistration, setSavedRegistration] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Payment state
  const isPaidEvent = event?.price > 0;
  const [paymentStep, setPaymentStep] = useState(false); // show payment panel
  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'pending'|'successful'|'failed'
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (id) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${id}/status`);
        if (!res.ok) return;
        const data = await res.json();
        const status = data.payment?.status_local ?? data.status;
        setPaymentStatus(status);
        if (status === "successful") {
          stopPolling();
          toast.success("Paiement confirmé ! Inscription validée.");
          setSuccess(true);
          if (onSuccess) onSuccess();
        } else if (status === "failed") {
          stopPolling();
          toast.error("Le paiement a échoué. Veuillez réessayer.");
        }
      } catch {
        // silent — keep polling
      }
    }, 5000);
  };

  const handlePayment = async () => {
    const phone = paymentPhone.trim();
    if (!phone) {
      toast.error("Entrez votre numéro de téléphone MoMo.");
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payments/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: savedRegistration?.id,
          event_id: event.id,
          amount: event.price,
          phone_number: phone,
          description: `Inscription – ${event.title}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur paiement");
      const pid = data.payment?.id ?? data.id;
      setPaymentId(pid);
      setPaymentStatus("pending");
      toast.info("Vérifiez votre téléphone pour valider le paiement MoMo.");
      startPolling(pid);
    } catch (err) {
      toast.error(err.message || "Impossible de lancer le paiement.");
    } finally {
      setPaymentLoading(false);
    }
  };
  const [geo, setGeo] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    label: null,
    city: null,
    region: null,
    country: null,
    loading: true,
    error: null,
  });

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    age: "",
    id_type: "",
    id_number: "",
  });

  useEffect(() => {
    base44.auth.me()
      .then((user) => {
        setCurrentUser(user);
        const nameParts = (user.full_name || "").split(" ");
        const nextEmail = user.email || "";
        setFormData((prev) => ({
          ...prev,
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          email: nextEmail,
        }));
        setMethod(isGmailEmail(nextEmail) ? "email_auto" : "formulaire");
      })
      .catch(() => {
        setMethod("formulaire");
      })
      .finally(() => setUserLoading(false));
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          const accuracy = pos.coords.accuracy || null;

          setGeo((prev) => ({
            ...prev,
            latitude,
            longitude,
            accuracy,
            loading: true,
            error: null,
          }));

          try {
            const location = await reverseGeocode(latitude, longitude);
            setGeo((prev) => ({
              ...prev,
              ...location,
              latitude,
              longitude,
              accuracy,
              loading: false,
              error: null,
            }));
          } catch {
            setGeo((prev) => ({
              ...prev,
              latitude,
              longitude,
              accuracy,
              loading: false,
              error: "Localisation textuelle indisponible",
            }));
          }
        },
        () => {
          setGeo((prev) => ({
            ...prev,
            loading: false,
            error: "Géolocalisation refusée ou indisponible",
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    } else {
      setGeo((prev) => ({
        ...prev,
        loading: false,
        error: "Géolocalisation non supportée",
      }));
    }
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailProvider = detectEmailProvider(formData.email);
      const hasGmailAccount = isGmailEmail(formData.email) || isGmailEmail(currentUser?.email);

      const registrationData = {
        event_id: event.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: normalizeParticipantEmail(formData.email) || undefined,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        id_type: formData.id_type || undefined,
        id_number: formData.id_number || undefined,
        geo_latitude: geo.latitude,
        geo_longitude: geo.longitude,
        geo_accuracy: geo.accuracy,
        geo_location_label: geo.label,
        geo_city: geo.city,
        geo_region: geo.region,
        geo_country: geo.country,
        email_provider: emailProvider,
        has_gmail_account: hasGmailAccount,
        status: isPaidEvent ? "en_attente_paiement" : "en_attente",
        registration_method: method,
      };

      const created = await base44.entities.Registration.create(registrationData);
      const reg = created || { ...registrationData, id: Date.now().toString(), created_date: new Date().toISOString() };
      setSavedRegistration(reg);

      if (registrationData.email) {
        setParticipantEmail(registrationData.email);
      }
      trackUserAction({
        action: "event_registration_created",
        user_email: registrationData.email,
        event_id: event.id,
        event_title: event.title,
        event_category: event.category,
        context: "registration_form",
      });

      if (isPaidEvent) {
        // Pre-fill payment phone from form
        setPaymentPhone(formData.phone || "");
        setPaymentStep(true);
        toast.info(`Événement payant — ${event.price.toLocaleString()} FCFA. Procédez au paiement.`);
      } else {
        setSuccess(true);
        toast.success("Inscription envoyée avec succès !");
        if (onSuccess) onSuccess();
      }
    } catch {
      toast.error("Impossible d'envoyer l'inscription pour le moment. Réessayez dans quelques instants.");
    } finally {
      setLoading(false);
    }
  };

  // ── Payment step (paid events) ─────────────────────────────────────────────
  const emailProvider = detectEmailProvider(formData.email);
  const hasGmailAccount = isGmailEmail(formData.email) || isGmailEmail(currentUser?.email);

  if (paymentStep && !success) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Paiement Mobile Money
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
              <p className="text-sm text-muted-foreground">Événement</p>
              <p className="font-semibold">{event.title}</p>
              <p className="text-lg font-bold text-primary">{event.price?.toLocaleString()} FCFA</p>
            </div>

            {paymentStatus === null && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Numéro MoMo (MTN ou Orange) *</Label>
                  <Input
                    type="tel"
                    placeholder="ex: 6XXXXXXXX"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    disabled={paymentLoading}
                  />
                  <p className="text-xs text-muted-foreground">Entrez le numéro qui recevra la demande de paiement.</p>
                </div>
                <Button className="w-full" size="lg" onClick={handlePayment} disabled={paymentLoading}>
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Smartphone className="w-4 h-4 mr-2" />}
                  {paymentLoading ? "Envoi en cours..." : "Payer maintenant"}
                </Button>
              </div>
            )}

            {paymentStatus === "pending" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold">En attente de confirmation</p>
                  <p className="text-sm text-muted-foreground">
                    Une demande a été envoyée au <strong>{paymentPhone}</strong>.<br />
                    Approuvez-la sur votre téléphone.
                  </p>
                </div>
                <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" /> Vérification en cours…
                </Badge>
              </div>
            )}

            {paymentStatus === "failed" && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Le paiement a échoué ou a expiré. Vérifiez votre solde et réessayez.
                </p>
                <Button
                  className="w-full"
                  onClick={() => { setPaymentStatus(null); setPaymentId(null); }}
                >
                  Réessayer le paiement
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (success) {
    const handleDownloadTicket = async () => {
      setTicketLoading(true);
      try {
        await generateTicketPDF({ event, registration: savedRegistration || formData });
      } catch {
        toast.error("Impossible de générer le billet. Réessayez.");
      } finally {
        setTicketLoading(false);
      }
    };

    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Card className="py-8">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Inscription réussie !</h3>
              <p className="text-muted-foreground">
                Votre inscription à <strong>{event.title}</strong> est en attente de validation.
                {formData.email && " Vous recevrez un email de confirmation."}
              </p>
            </div>
            <Button
              onClick={handleDownloadTicket}
              disabled={ticketLoading}
              className="w-full gap-2"
              variant="outline"
            >
              {ticketLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {ticketLoading ? "Génération du billet..." : "Télécharger mon billet (PDF)"}
            </Button>
            <Link to="/participant/tickets" className="block">
              <Button className="w-full" variant="secondary">
                Voir le statut de mon billet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">S'inscrire à cet événement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {currentUser && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{currentUser.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
            </div>
            <Badge variant="secondary" className="text-xs shrink-0">Connecté</Badge>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {hasGmailAccount && (
            <Badge variant="secondary" className="gap-1">
              <Mail className="w-3 h-3" /> Compte Gmail détecté
            </Badge>
          )}
          {emailProvider && !hasGmailAccount && (
            <Badge variant="outline">Email: {emailProvider}</Badge>
          )}
        </div>

        <div className="flex gap-2">
          {(currentUser || hasGmailAccount) && (
            <button
              type="button"
              onClick={() => setMethod("email_auto")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                method === "email_auto"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              <Mail className="w-4 h-4" /> Inscription rapide
            </button>
          )}
          <button
            type="button"
            onClick={() => setMethod("formulaire")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
              method === "formulaire"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <FileText className="w-4 h-4" /> Formulaire complet
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {method === "email_auto" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prénom *</Label>
                  <Input required value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom *</Label>
                  <Input required value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email (détecté automatiquement)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  {hasGmailAccount ? "Adresse Gmail détectée automatiquement" : "Email pré-rempli depuis votre compte connecté"}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone *</Label>
                <Input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+225 XX XX XX XX"
                />
              </div>
            </div>
          )}

          {method === "formulaire" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prénom *</Label>
                  <Input required value={formData.first_name} onChange={(e) => handleChange("first_name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nom *</Label>
                  <Input required value={formData.last_name} onChange={(e) => handleChange("last_name", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="optionnel" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Téléphone *</Label>
                  <Input required type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+225 XX XX XX XX" />
                </div>
                <div className="space-y-1.5">
                  <Label>Genre</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homme">Homme</SelectItem>
                      <SelectItem value="femme">Femme</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Âge</Label>
                  <Input type="number" value={formData.age} onChange={(e) => handleChange("age", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Type de pièce d'identité</Label>
                  <Select value={formData.id_type} onValueChange={(v) => handleChange("id_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cni">CNI</SelectItem>
                      <SelectItem value="passeport">Passeport</SelectItem>
                      <SelectItem value="permis">Permis de conduire</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Numéro de pièce d'identité</Label>
                <Input value={formData.id_number} onChange={(e) => handleChange("id_number", e.target.value)} />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {loading
              ? "Inscription en cours..."
              : isPaidEvent
              ? `S'inscrire et payer (${event.price?.toLocaleString()} FCFA)`
              : "S'inscrire"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}