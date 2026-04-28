import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { createRegistration } from "@/api/registrationsApi";
import { listFormFields } from "@/api/formFieldsApi";
import { getCreatorUser } from "@/lib/creatorSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2, User, Download, Smartphone, AlertCircle, Clock, ExternalLink, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { generateTicketPDF } from "@/utils/generateTicket";
import { getGeolocation } from "@/utils/geolocation";
import { getParticipantEmail, normalizeParticipantEmail, setParticipantEmail } from "@/lib/participantSession";
import { trackUserAction } from "@/lib/trackUserAction";
import RegistrationFlowHeader from "@/components/events/RegistrationFlowHeader";
import SmartSignupTeaser from "@/components/events/SmartSignupTeaser";

const isGmailEmail = (email) => /@gmail\.com$/i.test((email || "").trim());

const detectEmailProvider = (email) => {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized.includes("@")) return null;
  return normalized.split("@")[1] || null;
};

const normalizePriceAmount = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric;
  const digitsOnly = raw.replace(/\D/g, "");
  return digitsOnly ? Number(digitsOnly) : 0;
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

const collectPaymentWithFallback = async (payload) => {
  const endpoints = ["/api/payments/collect", "http://localhost:3001/api/payments/collect"];
  let lastResponse = null;

  for (let i = 0; i < endpoints.length; i += 1) {
    const url = endpoints[i];
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Retry on direct backend URL when proxy returns gateway-level errors.
      if ((response.status === 502 || response.status === 503 || response.status === 504) && i < endpoints.length - 1) {
        lastResponse = response;
        continue;
      }

      return response;
    } catch (error) {
      if (i === endpoints.length - 1) throw error;
    }
  }

  return lastResponse;
};

export default function RegistrationForm({ event, onSuccess }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showTicketsPrompt, setShowTicketsPrompt] = useState(false);
  const [savedRegistration, setSavedRegistration] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Payment state
  const paymentAmount = normalizePriceAmount(event?.price);
  const isPaidEvent = paymentAmount > 0;
  const [paymentStep, setPaymentStep] = useState(false); // show payment panel
  const [paymentId, setPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'pending'|'successful'|'failed'
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMeta, setPaymentMeta] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const lastCheckoutUrl = useRef(null); // keep ref to reopen modal
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const pollIntervalRef = useRef(10000);

  const startPolling = (id) => {
    stopPolling();
    pollIntervalRef.current = 10000;

    const doPoll = async () => {
      try {
        const res = await fetch(`/api/payments/${id}/status`);
        if (res.status === 429) {
          // Rate limited — back off exponentially (max 60s)
          pollIntervalRef.current = Math.min(pollIntervalRef.current * 2, 60000);
          pollRef.current = setTimeout(doPoll, pollIntervalRef.current);
          return;
        }
        if (!res.ok) {
          pollRef.current = setTimeout(doPoll, pollIntervalRef.current);
          return;
        }
        const data = await res.json();
        const status = data.payment?.status_local ?? data.status;
        setPaymentStatus(status);
        if (status === "successful") {
          stopPolling();
          setCheckoutUrl(null);
          if (savedRegistration?.email || formData.email) {
            setParticipantEmail(savedRegistration?.email || formData.email);
          }
          setPaymentMeta({
            campay_reference: data.payment?.campay_reference || null,
            operator: data.payment?.operator || null,
            paid_at: data.payment?.paid_at || new Date().toISOString(),
          });
          toast.success("Paiement confirmé ! Inscription validée.");
          setSuccess(true);
          setShowTicketsPrompt(true);
          if (onSuccess) onSuccess();
        } else if (status === "failed") {
          stopPolling();
          toast.error("Le paiement a échoué. Veuillez réessayer.");
        } else {
          pollRef.current = setTimeout(doPoll, pollIntervalRef.current);
        }
      } catch {
        pollRef.current = setTimeout(doPoll, pollIntervalRef.current);
      }
    };

    pollRef.current = setTimeout(doPoll, pollIntervalRef.current);
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const res = await collectPaymentWithFallback({
        registration_id: savedRegistration?.id,
        event_id: event.id,
        amount: paymentAmount,
        description: `Inscription – ${event.title}`,
        payer_name: [formData.first_name, formData.last_name].filter(Boolean).join(" ") || undefined,
        phone_number: formData.phone || undefined,
        redirect_url: `${window.location.origin}/payment/success`,
        failure_redirect_url: `${window.location.origin}/payment/cancel`,
      });

      if (!res) throw new Error("Service paiement indisponible");

      const raw = await res.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: raw || "Erreur paiement" }; }

      if (!res.ok) {
        const raw_msg = data.error || data.message || "Erreur paiement";
        const m = raw_msg.toLowerCase();
        if (m.includes("outside allowed limits") || m.includes("min:")) {
          const minMatch = raw_msg.match(/Min:\s*([\d.]+)/i);
          const min = minMatch ? Math.ceil(Number(minMatch[1])) : 100;
          throw new Error(`Montant insuffisant. Le montant minimum de paiement est ${min.toLocaleString()} FCFA.`);
        }
        if (m.includes("service") && m.includes("not found")) throw new Error("Service de paiement temporairement indisponible. Réessayez plus tard.");
        if (m.includes("doesn't support")) throw new Error("Ce réseau n'est pas encore activé pour les paiements. Contactez le support.");
        throw new Error(raw_msg);
      }

      const pid = data.payment?.id ?? data.id;
      const checkoutUrl = data.checkout_url;

      setPaymentId(pid);
      setPaymentStatus("pending");

      if (checkoutUrl) {
        lastCheckoutUrl.current = checkoutUrl;
        setCheckoutUrl(checkoutUrl);
        toast.info("Complétez le paiement dans la fenêtre ci-dessous.");
      } else {
        toast.info("Paiement initié. Vérification en cours...");
      }

      startPolling(pid);
    } catch (err) {
      toast.error(err?.message || "Impossible de lancer le paiement.");
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
  });
  const [extraData, setExtraData] = useState({});

  const { data: customFields = [] } = useQuery({
    queryKey: ["form-fields", event?.id],
    queryFn: () => listFormFields(event.id),
    enabled: !!event?.id,
    staleTime: 60_000,
  });

  useEffect(() => {
    const participantEmail = getParticipantEmail();
    if (participantEmail) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || participantEmail,
      }));
    }

    Promise.resolve(getCreatorUser())
      .then((user) => {
        if (!user) throw new Error("no user");
        setCurrentUser(user);
        const nameParts = (user.full_name || "").split(" ");
        const nextEmail = user.email || "";
        setFormData((prev) => ({
          ...prev,
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          email: nextEmail,
          phone: user.phone || prev.phone,
        }));
      })
      .catch(() => {
        const participantEmail = getParticipantEmail();
        if (!participantEmail) return;
        setFormData((prev) => ({
          ...prev,
          email: prev.email || participantEmail,
        }));
      });
  }, []);

  useEffect(() => {
    getGeolocation()
      .then(async (geoData) => {
        if (!geoData) {
          setGeo((prev) => ({
            ...prev,
            loading: false,
            error: "Géolocalisation non disponible",
          }));
          return;
        }

        const { latitude, longitude, accuracy } = geoData;
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
      })
      .catch(() => {
        setGeo((prev) => ({
          ...prev,
          loading: false,
          error: "Géolocalisation refusée ou indisponible",
        }));
      });
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedEmail = normalizeParticipantEmail(formData.email);
    const normalizedPhone = String(formData.phone || "").trim();

    if (!normalizedEmail && !normalizedPhone) {
      toast.error("Renseignez au moins un email ou un numero de telephone.");
      return;
    }

    setLoading(true);

    try {
      const emailProvider = detectEmailProvider(formData.email);
      const hasGmailAccount = isGmailEmail(formData.email) || isGmailEmail(currentUser?.email);

      const registrationData = {
        event_id: event.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: normalizedEmail || undefined,
        phone: normalizedPhone || undefined,
        gender: formData.gender || undefined,
        geo_latitude: geo.latitude ?? undefined,
        geo_longitude: geo.longitude ?? undefined,
        geo_accuracy: geo.accuracy ?? undefined,
        geo_location_label: geo.label ?? undefined,
        geo_city: geo.city ?? undefined,
        geo_region: geo.region ?? undefined,
        geo_country: geo.country ?? undefined,
        email_provider: emailProvider,
        has_gmail_account: hasGmailAccount,
        status: isPaidEvent ? "en_attente_paiement" : "en_attente",
        registration_method: "formulaire",
        extra_data: extraData,
      };

      const created = await createRegistration(registrationData);
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
        toast.info(`Événement payant — ${paymentAmount.toLocaleString()} FCFA. Procédez au paiement.`);
      } else {
        setSuccess(true);
        setShowTicketsPrompt(true);
        toast.success("Inscription envoyée avec succès !");
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      toast.error(err?.message || "Impossible d'envoyer l'inscription pour le moment. Réessayez dans quelques instants.");
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
        <div className="mb-4">
          <RegistrationFlowHeader currentStep="payment" />
        </div>

        {/* Checkout modal */}
        <Dialog open={!!checkoutUrl} onOpenChange={(open) => { if (!open) setCheckoutUrl(null); }}>
          <DialogContent className="max-w-lg w-full p-0 overflow-hidden" style={{ height: "85vh" }}>
            <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between">
              <DialogTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                Paiement – {paymentAmount.toLocaleString()} FCFA
              </DialogTitle>
              <DialogDescription className="sr-only">
                Fenetre de paiement securise pour finaliser l'inscription.
              </DialogDescription>
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                <ExternalLink className="w-3 h-3" /> Ouvrir dans un onglet
              </a>
            </DialogHeader>
            {checkoutUrl && (
              <iframe
                src={checkoutUrl}
                title="Paiement Easy Transact"
                className="w-full flex-1"
                style={{ height: "calc(85vh - 56px)", border: "none" }}
                allow="payment"
              />
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Paiement Mobile Money – Easy Transact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
              <p className="text-sm text-muted-foreground">Événement</p>
              <p className="font-semibold">{event.title}</p>
              <p className="text-lg font-bold text-primary">{paymentAmount.toLocaleString()} FCFA</p>
            </div>

            {paymentStatus === null && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Une fenêtre de paiement sécurisé s'ouvrira sur cette page. Entrez votre numéro Mobile Money (MTN ou Orange) pour valider.
                </p>
                <Button className="w-full" size="lg" onClick={handlePayment} disabled={paymentLoading}>
                  {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Smartphone className="w-4 h-4 mr-2" />}
                  {paymentLoading ? "Préparation du paiement..." : "Payer maintenant"}
                </Button>
              </div>
            )}

            {(paymentStatus === "pending" || paymentStatus === "initiated") && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold">En attente de confirmation du paiement</p>
                  <p className="text-sm text-muted-foreground">
                    Complétez le paiement dans la fenêtre de paiement.<br />
                    <span className="text-amber-600">Cette page se met à jour automatiquement dès la confirmation.</span>
                  </p>
                </div>
                <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300">
                  <Loader2 className="w-3 h-3 animate-spin" /> Vérification en cours…
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => lastCheckoutUrl.current && setCheckoutUrl(lastCheckoutUrl.current)}
                  disabled={!lastCheckoutUrl.current}
                >
                  <Smartphone className="w-3 h-3" /> Rouvrir la fenêtre de paiement
                </Button>
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
        await generateTicketPDF({ event, registration: savedRegistration || formData, payment: paymentMeta });
      } catch {
        toast.error("Impossible de générer le billet. Réessayez.");
      } finally {
        setTicketLoading(false);
      }
    };

    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="mb-4">
          <RegistrationFlowHeader currentStep="confirmation" />
        </div>

        <Card className="overflow-hidden">
          <div className="bg-emerald-500 py-6 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Inscription réussie !</h3>
            <p className="text-emerald-100 text-sm mt-1">{event.title}</p>
          </div>
          <CardContent className="space-y-4 pt-5">
            {formData.email && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Email de confirmation envoyé</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Un email avec votre billet a été envoyé à <strong>{formData.email}</strong></p>
                </div>
              </div>
            )}
            <div className="text-center text-sm text-muted-foreground">
              Votre inscription est <strong>en attente de validation</strong> par l'organisateur.
            </div>
            <Button
              onClick={handleDownloadTicket}
              disabled={ticketLoading}
              className="w-full gap-2"
              variant="outline"
            >
              {ticketLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {ticketLoading ? "Génération..." : "Télécharger mon billet (PDF)"}
            </Button>
            {formData.email && (
              <Link to={`/participant/tickets?email=${encodeURIComponent(formData.email)}`} className="block">
                <Button className="w-full gap-2" variant="secondary">
                  <Ticket className="w-4 h-4" /> Accéder à mes billets
                </Button>
              </Link>
            )}
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
        <RegistrationFlowHeader currentStep="form" />

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

        <form onSubmit={handleSubmit} className="space-y-4">
          {(() => {
            const cfg = event?.registration_config || {};
            const hideEmail  = !!cfg.hide_email;
            const hidePhone  = !!cfg.hide_phone;
            const hideGender = !!cfg.hide_gender;
            const showPhone  = !hidePhone && (!currentUser || !currentUser.phone);
            const showGender = !hideGender;
            return (
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
                {!hideEmail && !currentUser && (
                  <div className="space-y-1.5">
                    <Label>Email <span className="text-muted-foreground text-xs">(pour recevoir votre billet)</span></Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="votre@email.com"
                    />
                  </div>
                )}
                {(showPhone || showGender) && (
                  <div className="grid grid-cols-2 gap-3">
                    {showPhone && (
                      <div className="space-y-1.5">
                        <Label>Téléphone</Label>
                        <Input type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="+237 6XX XX XX XX" />
                      </div>
                    )}
                    {showGender && (
                      <div className={`space-y-1.5 ${showPhone ? "" : "col-span-2"}`}>
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
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Champs personnalisés configurés par l'admin pour cet événement */}
          {customFields.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-border">
              {customFields.map((field) => {
                const val = extraData[field.field_key] ?? "";
                const setVal = (v) =>
                  setExtraData((prev) => ({ ...prev, [field.field_key]: v }));

                return (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={`ef-${field.field_key}`}>
                      {field.field_label}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {(field.field_type === "text" || field.field_type === "email" || field.field_type === "tel") && (
                      <Input
                        id={`ef-${field.field_key}`}
                        type={field.field_type}
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={field.placeholder || ""}
                        required={field.is_required}
                      />
                    )}

                    {field.field_type === "number" && (
                      <Input
                        id={`ef-${field.field_key}`}
                        type="number"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={field.placeholder || ""}
                        required={field.is_required}
                      />
                    )}

                    {field.field_type === "date" && (
                      <Input
                        id={`ef-${field.field_key}`}
                        type="date"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        required={field.is_required}
                      />
                    )}

                    {field.field_type === "textarea" && (
                      <Textarea
                        id={`ef-${field.field_key}`}
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={field.placeholder || ""}
                        required={field.is_required}
                        rows={3}
                      />
                    )}

                    {field.field_type === "select" && (
                      <Select value={val} onValueChange={setVal} required={field.is_required}>
                        <SelectTrigger id={`ef-${field.field_key}`}>
                          <SelectValue placeholder={field.placeholder || "Sélectionner…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(field.field_options || []).map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.field_type === "checkbox" && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`ef-${field.field_key}`}
                          checked={val === true || val === "true"}
                          onCheckedChange={(checked) => setVal(checked)}
                          required={field.is_required}
                        />
                        <label htmlFor={`ef-${field.field_key}`} className="text-sm text-muted-foreground cursor-pointer">
                          {field.placeholder || field.field_label}
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {loading
              ? "Inscription en cours..."
              : isPaidEvent
                ? `S'inscrire et payer (${paymentAmount.toLocaleString()} FCFA)`
              : "S'inscrire"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}