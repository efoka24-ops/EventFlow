import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, CalendarDays, Ticket, CheckCircle2, ArrowRight,
  Search, UserPlus, CreditCard, Download, Bell, BarChart3,
  Settings, MessageSquare, Building2, Eye, Shield, QrCode,
  ChevronRight, BookOpen, Star, Zap, HelpCircle,
} from "lucide-react";

// ── Composant bloc étape ──────────────────────────────────────────────────────
function Step({ number, title, description, icon: Icon, tip }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
          {number}
        </div>
        <div className="w-px flex-1 bg-border/60 mt-2" />
      </div>
      <div className="pb-8 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {tip && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
            <Star className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Composant carte fonctionnalité ────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, badge }) {
  return (
    <div className="p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/20 transition-colors space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {badge && <Badge variant="secondary" className="text-[10px] h-5">{badge}</Badge>}
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ── Page principale ───────────────────────────────────────────────────────────
export default function GuideUtilisation() {
  const [tab, setTab] = useState("participant");

  const { data: faqs = [] } = useQuery({
    queryKey: ["guide-faqs"],
    queryFn: () => fetch(`${API_BASE}/guide-faqs`).then((r) => r.json()).catch(() => []),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* ── En-tête ── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          Guide d'utilisation
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Comment utiliser EventFlow ?
        </h1>
        <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
          Tout ce dont vous avez besoin pour créer, gérer et rejoindre des événements
          en Afrique, depuis votre téléphone ou ordinateur.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Badge variant="outline" className="gap-1.5"><Zap className="w-3 h-3 text-amber-500" />Mobile-first</Badge>
          <Badge variant="outline" className="gap-1.5"><Shield className="w-3 h-3 text-emerald-500" />Paiement sécurisé</Badge>
          <Badge variant="outline" className="gap-1.5"><Star className="w-3 h-3 text-primary" />Gratuit pour démarrer</Badge>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full rounded-xl h-auto p-1">
          <TabsTrigger value="participant" className="rounded-lg gap-2 py-2.5">
            <Ticket className="w-4 h-4" />
            <span className="hidden sm:inline">Participant</span>
          </TabsTrigger>
          <TabsTrigger value="organisateur" className="rounded-lg gap-2 py-2.5">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">Organisateur</span>
          </TabsTrigger>
          <TabsTrigger value="fonctionnalites" className="rounded-lg gap-2 py-2.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Fonctionnalités</span>
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════
            PARTICIPANT
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="participant" className="mt-8 space-y-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-primary" />
                Je veux m'inscrire à un événement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Step number="1" icon={Search} title="Trouver un événement"
                description="Rendez-vous sur la page Événements et explorez les concerts, conférences, formations et ateliers disponibles. Filtrez par ville, catégorie ou date." />
              <Step number="2" icon={Eye} title="Consulter la fiche de l'événement"
                description="Cliquez sur un événement pour voir tous les détails : lieu, date, prix, organisateur, nombre de places restantes et formulaire d'inscription." />
              <Step number="3" icon={UserPlus} title="Remplir le formulaire d'inscription"
                description="Entrez votre prénom, nom, email et numéro de téléphone. Certains événements demandent des informations supplémentaires (ville de résidence, âge…) configurées par l'organisateur."
                tip="Votre email permet de recevoir la confirmation et votre billet PDF." />
              <Step number="4" icon={CreditCard} title="Payer si l'événement est payant"
                description="Pour les événements payants, un module de paiement Mobile Money (MTN ou Orange) s'ouvre. Entrez votre numéro et validez l'invitation de paiement depuis votre téléphone." />
              <Step number="5" icon={Download} title="Télécharger votre billet"
                description="Après confirmation, téléchargez votre billet PDF avec votre code de confirmation unique (#XXXXXXXX). Présentez-le à l'entrée de l'événement."
                tip="Accédez à tous vos billets à tout moment sur /participant/tickets avec votre email." />
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="w-4 h-4 text-primary" />
                Mon code de confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chaque inscription génère automatiquement un <strong>code de confirmation unique</strong> de 8 caractères (ex. : <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">#AB3C12FD</code>).
                Ce code permet à l'organisateur de vérifier votre présence à l'entrée, même sans connexion internet.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                  <p className="text-xs font-semibold">Où trouver mon code ?</p>
                  <p className="text-xs text-muted-foreground">Dans votre email de confirmation, sur votre billet PDF, et sur la page <Link to="/participant/tickets" className="text-primary underline">Mes billets</Link>.</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1">
                  <p className="text-xs font-semibold">À quoi ça sert ?</p>
                  <p className="text-xs text-muted-foreground">L'organisateur scanne ou saisit votre code pour vérifier votre inscription en temps réel et valider votre entrée.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Link to="/events">
              <Button className="gap-2 rounded-full px-6">
                <Search className="w-4 h-4" /> Explorer les événements
              </Button>
            </Link>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            ORGANISATEUR
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="organisateur" className="mt-8 space-y-8">

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="w-4 h-4 text-primary" />
                1. Créer mon compte organisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Step number="1" icon={UserPlus} title="S'inscrire sur la plateforme"
                description="Cliquez sur « Créer un événement » puis « Créer un compte ». Renseignez votre nom complet, email et numéro de téléphone Mobile Money. Choisissez un mot de passe sécurisé." />
              <Step number="2" icon={CheckCircle2} title="Connexion à votre espace"
                description="Une fois le compte créé, connectez-vous avec votre email (ou téléphone) et mot de passe. Vous accédez à votre tableau de bord organisateur."
                tip="Votre compte est examiné par l'équipe EventFlow avant que vos événements soient publiés publiquement." />
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="w-4 h-4 text-primary" />
                2. Créer et publier un événement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Step number="1" icon={CalendarDays} title="Remplir les informations de base"
                description="Depuis votre dashboard, cliquez sur « Créer un événement ». Renseignez le titre, la description, la catégorie, la date de début/fin, la ville et le lieu." />
              <Step number="2" icon={CreditCard} title="Définir le tarif"
                description="Laissez le prix à 0 pour un événement gratuit, ou entrez le montant en FCFA pour un événement payant. Le paiement Mobile Money est activé automatiquement." />
              <Step number="3" icon={Settings} title="Configurer le formulaire d'inscription"
                description="Dans le menu d'actions de votre événement (⋯), cliquez sur « Champs du formulaire ». Masquez les champs inutiles (email, téléphone, genre) ou ajoutez des champs personnalisés (âge, ville de résidence, profession…)."
                tip="Les champs personnalisés peuvent être de type texte, nombre, date, liste de choix ou case à cocher." />
              <Step number="4" icon={Eye} title="Soumettre pour validation"
                description="Votre événement passe en statut « En attente de validation ». L'équipe EventFlow l'examine et le publie. Vous recevez une notification dès sa mise en ligne." />
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-primary" />
                3. Gérer les participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Step number="1" icon={Users} title="Consulter la liste des participants"
                description="Dans l'onglet « Participants » de votre dashboard, vous voyez toutes les personnes inscrites à vos événements. Filtrez par événement, statut ou recherchez par nom/email/téléphone." />
              <Step number="2" icon={CheckCircle2} title="Valider ou refuser une inscription"
                description="Pour chaque inscription « En attente », utilisez les boutons Valider ou Refuser. Un participant validé reçoit une notification et son statut passe à « Validée »."
                tip="Les inscriptions payantes passent d'abord par « En attente de paiement » avant d'être validées automatiquement après confirmation du paiement." />
              <Step number="3" icon={QrCode} title="Vérifier les codes à l'entrée"
                description="Le jour J, vérifiez la présence d'un participant en consultant son code de confirmation (#XXXXXXXX) visible dans la liste. Ce code est unique et inaltérable." />
              <Step number="4" icon={Download} title="Exporter la liste en Excel"
                description="Cliquez sur « Export Excel » pour télécharger la liste complète des participants (nom, email, téléphone, statut, ville) au format .xlsx, utilisable dans Excel ou Google Sheets." />
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="w-4 h-4 text-primary" />
                4. Communiquer avec les participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Step number="1" icon={MessageSquare} title="Envoyer un message groupé"
                description="Dans l'onglet « Messagerie », rédigez un objet et un message. Choisissez si vous voulez envoyer à tous vos participants ou uniquement ceux d'un événement spécifique." />
              <Step number="2" icon={Bell} title="Historique des notifications"
                description="Consultez l'historique de toutes les notifications envoyées : date, destinataire et statut de livraison."
                tip="Les emails sont envoyés uniquement aux participants ayant renseigné une adresse email lors de l'inscription." />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Link to="/submit-event">
              <Button className="gap-2 rounded-full px-6">
                <CalendarDays className="w-4 h-4" /> Créer mon premier événement
              </Button>
            </Link>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            FONCTIONNALITÉS
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="fonctionnalites" className="mt-8 space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Vue d'ensemble de toutes les fonctionnalités disponibles sur EventFlow.
          </p>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pour les participants</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard icon={Search} title="Exploration des événements"
                description="Recherche par ville, catégorie et date. Filtres avancés et cartes de prévisualisation." />
              <FeatureCard icon={Ticket} title="Inscription en ligne"
                description="Formulaire simplifié, confirmation instantanée par email, billet PDF téléchargeable." />
              <FeatureCard icon={CreditCard} title="Paiement Mobile Money"
                description="MTN Mobile Money et Orange Money. Paiement sécurisé via Easy Transact." badge="MTN · Orange" />
              <FeatureCard icon={QrCode} title="Code de confirmation"
                description="Code unique par inscription pour vérification à l'entrée. Accessible sur votre billet et dans Mes billets." />
              <FeatureCard icon={Download} title="Mes billets"
                description="Retrouvez tous vos billets avec votre email sur /participant/tickets, sans création de compte obligatoire." />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pour les organisateurs</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard icon={CalendarDays} title="Création d'événements"
                description="Titre, description, date, lieu, image de couverture avec recadrage intégré, prix et capacité max." />
              <FeatureCard icon={Settings} title="Formulaire configurable"
                description="Activez/désactivez email, téléphone, genre. Ajoutez des champs personnalisés (texte, nombre, date, liste, case à cocher)." badge="Nouveau" />
              <FeatureCard icon={Users} title="Gestion des participants"
                description="Liste complète, validation/refus par inscription, filtres par statut et recherche par nom ou contact." />
              <FeatureCard icon={Download} title="Export Excel"
                description="Exportez la liste des participants au format .xlsx avec un clic, filtrable par événement." />
              <FeatureCard icon={MessageSquare} title="Messagerie groupée"
                description="Envoi d'emails à tous vos participants ou à ceux d'un événement spécifique." />
              <FeatureCard icon={BarChart3} title="Tableau de bord & revenus"
                description="Graphiques d'inscriptions, répartition par statut, suivi des revenus par événement payant." />
              <FeatureCard icon={Building2} title="Gestion des sponsors"
                description="Ajoutez les sponsors de chaque événement (logo, niveau : or/argent/bronze, site web)." />
              <FeatureCard icon={Bell} title="Notifications automatiques"
                description="Email de confirmation envoyé automatiquement à chaque participant lors de son inscription." />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sécurité & confidentialité</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <FeatureCard icon={Shield} title="Données protégées"
                description="Les organisateurs ne voient que les participants de leurs propres événements. Aucun accès croisé." />
              <FeatureCard icon={Shield} title="Sessions sécurisées"
                description="Authentification JWT avec refresh token. Déconnexion automatique après inactivité prolongée." />
            </div>
          </div>

          {/* FAQ rapide */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HelpCircle className="w-4 h-4 text-primary" />
                Questions fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 divide-y divide-border/40">
              {faqs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Aucune question fréquente pour l'instant.</p>
              ) : faqs.map((faq) => (
                <div key={faq.id} className="pt-4 first:pt-0 space-y-1">
                  <p className="text-sm font-semibold flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {faq.question}
                  </p>
                  <p className="text-sm text-muted-foreground pl-6">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── CTA bas de page ── */}
      <div className="text-center py-6 space-y-3 border-t border-border/40">
        <p className="text-sm text-muted-foreground">Vous n'avez pas trouvé votre réponse ?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/help">
            <Button variant="outline" className="gap-2 rounded-full">
              <HelpCircle className="w-4 h-4" /> Centre d'aide
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="outline" className="gap-2 rounded-full">
              <ArrowRight className="w-4 h-4" /> Contactez-nous
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
