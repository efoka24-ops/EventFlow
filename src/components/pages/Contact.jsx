import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const SUBJECTS = [
  "Question générale",
  "Problème technique",
  "Inscription à un événement",
  "Gestion d'un événement",
  "Paiement / facturation",
  "Partenariat",
  "Autre",
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Une erreur est survenue");
      }
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Impossible d'envoyer le message");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Mail className="w-4 h-4" />
            Nous contacter
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Une question ? Écrivez-nous</h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Notre équipe vous répond sous 24 h. Pour une urgence, appelez-nous directement.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14 grid gap-12 lg:grid-cols-5">
        {/* Contact info */}
        <aside className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Coordonnées</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <a href="mailto:eventflow@trugroup.cm" className="text-sm font-medium hover:text-primary transition-colors">
                    eventflow@trugroup.cm
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Téléphone</p>
                  <a href="tel:+237678758976" className="text-sm font-medium hover:text-primary transition-colors">
                    +237 678 758 976
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Adresse</p>
                  <p className="text-sm font-medium">Garoua, Cameroun</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-5 space-y-2">
            <p className="text-sm font-semibold">Horaires de support</p>
            <p className="text-sm text-muted-foreground">Lundi – Vendredi : 8 h – 18 h (WAT)</p>
            <p className="text-sm text-muted-foreground">Samedi : 9 h – 13 h</p>
            <p className="text-xs text-muted-foreground mt-1">Réponse garantie sous 24 h ouvrées.</p>
          </div>
        </aside>

        {/* Form */}
        <div className="lg:col-span-3">
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Message envoyé !</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Merci de nous avoir contactés. Vous recevrez une confirmation par email et nous vous répondrons rapidement.
              </p>
              <Button variant="outline" onClick={() => setStatus(null)}>
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom complet <span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Jean Dupont"
                    value={form.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jean@exemple.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Sujet <span className="text-red-500">*</span></Label>
                <select
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Choisir un sujet…</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Décrivez votre demande en détail…"
                  value={form.message}
                  onChange={handleChange}
                  required
                  minLength={10}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{form.message.length} / 2000</p>
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <Button type="submit" disabled={status === "loading"} className="w-full gap-2">
                {status === "loading" ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
