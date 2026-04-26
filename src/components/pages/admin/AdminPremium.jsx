import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Crown, BarChart3, Palette, Plug, Star, CheckCircle2 } from "lucide-react";

const MODULES = [
  {
    name: "Abonnement Organisateur PRO",
    icon: Crown,
    color: "bg-amber-100 text-amber-700",
    description: "Offre premium pour organisateurs avec fonctionnalités avancées et visibilité accrue.",
    features: ["Badge PRO sur le profil", "Mise en avant automatique des événements", "Analytics avancées", "Support prioritaire"],
    status: "coming_soon",
  },
  {
    name: "Événements Sponsorisés",
    icon: Star,
    color: "bg-violet-100 text-violet-700",
    description: "Permettre aux organisateurs de booster la visibilité de leurs événements.",
    features: ["Position en tête de liste", "Badge 'Sponsorisé'", "Notification push ciblée", "Rapport de performance"],
    status: "coming_soon",
  },
  {
    name: "Analytics Avancées",
    icon: BarChart3,
    color: "bg-blue-100 text-blue-700",
    description: "Tableaux de bord avancés avec prédictions et segmentation.",
    features: ["Prédiction de ventes", "Segmentation audience", "Heatmaps", "Rapports automatisés"],
    status: "coming_soon",
  },
  {
    name: "Branding Personnalisé",
    icon: Palette,
    color: "bg-rose-100 text-rose-700",
    description: "Permettre aux organisateurs de personnaliser leurs pages événements.",
    features: ["Logo personnalisé", "Couleurs de marque", "Domaine personnalisé", "Templates exclusifs"],
    status: "coming_soon",
  },
  {
    name: "API Partenaires",
    icon: Plug,
    color: "bg-emerald-100 text-emerald-700",
    description: "Accès API pour intégrations tierces et partenariats commerciaux.",
    features: ["API REST complète", "Webhooks temps réel", "SDK JavaScript", "Documentation complète"],
    status: "coming_soon",
  },
];

export default function AdminPremium() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Modules Premium SaaS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Fonctionnalités avancées et monétisation de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card key={mod.name} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${mod.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">Bientôt disponible</Badge>
                </div>
                <CardTitle className="text-base mt-2">{mod.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{mod.description}</p>
                <ul className="space-y-1.5">
                  {mod.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Configurer
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Roadmap EventFlow Premium</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ces modules seront activables progressivement. Chaque module génère des revenus supplémentaires pour la plateforme (abonnements mensuels organisateurs, frais de sponsoring).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
