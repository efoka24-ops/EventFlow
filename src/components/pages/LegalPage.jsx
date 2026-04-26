import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ShieldCheck, Cookie, Scale } from "lucide-react";

const legalContent = {
  terms: {
    title: "Conditions d'utilisation",
    icon: FileText,
    intro:
      "EventFlow met en relation des organisateurs et des participants pour la découverte, la réservation et la gestion d'événements. L'utilisation de la plateforme implique l'acceptation des présentes conditions.",
    sections: [
      {
        title: "Objet du service",
        body:
          "La plateforme permet de publier des événements, gérer des inscriptions, émettre des billets et suivre certaines données d'usage nécessaires au bon fonctionnement du service.",
      },
      {
        title: "Responsabilités des organisateurs",
        body:
          "Chaque organisateur reste responsable de l'exactitude des informations publiées, du respect de la réglementation locale, de la tenue de son événement et du traitement des remboursements lorsque cela s'applique.",
      },
      {
        title: "Responsabilités des participants",
        body:
          "Les participants doivent fournir des informations exactes lors de l'inscription, conserver leurs billets et respecter les consignes communiquées par l'organisateur avant et pendant l'événement.",
      },
      {
        title: "Paiements et accès",
        body:
          "Lorsqu'un événement est payant, l'accès peut être conditionné à la validation du paiement. Les frais, modalités de confirmation et règles d'annulation sont affichés sur la page de l'événement ou communiqués par l'organisateur.",
      },
    ],
  },
  privacy: {
    title: "Politique de confidentialité",
    icon: ShieldCheck,
    intro:
      "EventFlow collecte uniquement les données utiles à la gestion des inscriptions, à l'émission des billets, à la sécurisation du service et à l'amélioration de l'expérience utilisateur.",
    sections: [
      {
        title: "Données collectées",
        body:
          "Nous pouvons traiter votre nom, votre email, votre numéro de téléphone, les informations liées à vos inscriptions, ainsi que certaines données techniques comme l'adresse IP, le navigateur et les interactions de navigation.",
      },
      {
        title: "Finalités",
        body:
          "Ces données servent à confirmer vos inscriptions, délivrer vos billets, prévenir la fraude, répondre aux demandes d'assistance et mesurer l'usage de la plateforme afin d'améliorer le service.",
      },
      {
        title: "Partage des données",
        body:
          "Les informations strictement nécessaires peuvent être partagées avec l'organisateur concerné, les prestataires techniques de paiement ou d'hébergement, ainsi que les autorités compétentes en cas d'obligation légale.",
      },
      {
        title: "Conservation et droits",
        body:
          "Les données sont conservées pendant la durée nécessaire à la gestion des inscriptions et au respect des obligations légales. Vous pouvez demander l'accès, la rectification ou la suppression de vos données via le support EventFlow.",
      },
    ],
  },
  cookies: {
    title: "Politique de cookies",
    icon: Cookie,
    intro:
      "EventFlow utilise des cookies et mécanismes de stockage similaires pour maintenir certaines sessions locales, mémoriser vos préférences et mesurer l'utilisation du site.",
    sections: [
      {
        title: "Cookies essentiels",
        body:
          "Ils permettent le fonctionnement de base du service, comme la conservation de votre session organisateur, de votre mini espace participant ou de certaines préférences d'interface.",
      },
      {
        title: "Mesure d'audience",
        body:
          "Des traceurs peuvent être utilisés pour comprendre les pages consultées, les parcours utilisateurs et les performances techniques afin d'améliorer le produit.",
      },
      {
        title: "Gestion de vos choix",
        body:
          "Vous pouvez limiter l'usage des cookies via les paramètres de votre navigateur. La désactivation de certains cookies essentiels peut toutefois dégrader certaines fonctionnalités du site.",
      },
    ],
  },
  notices: {
    title: "Mentions légales",
    icon: Scale,
    intro:
      "Cette page présente les informations d'identification du service et les principaux contacts utiles pour l'édition, l'hébergement et le support de la plateforme EventFlow.",
    sections: [
      {
        title: "Éditeur",
        body:
          "EventFlow est un service numérique de gestion d'événements destiné au marché africain. Pour toute demande relative au service, vous pouvez contacter l'équipe via contact@eventflow.cm.",
      },
      {
        title: "Hébergement",
        body:
          "L'application est hébergée sur des infrastructures cloud sécurisées opérées par des prestataires techniques sélectionnés pour garantir disponibilité, sauvegarde et supervision du service.",
      },
      {
        title: "Propriété intellectuelle",
        body:
          "Les éléments distinctifs de la plateforme, les interfaces, textes, visuels et composants propres à EventFlow restent protégés par les règles applicables en matière de propriété intellectuelle.",
      },
      {
        title: "Signalement",
        body:
          "Tout contenu illicite, événement frauduleux ou usage abusif peut être signalé au support afin de permettre une revue rapide et, si nécessaire, la suspension du contenu ou du compte concerné.",
      },
    ],
  },
};

export default function LegalPage() {
  const { slug } = useParams();

  const page = useMemo(() => legalContent[slug] || legalContent.terms, [slug]);
  const Icon = page.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-4">
        <Link to="/">
          <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Button>
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Informations légales</p>
            <h1 className="text-3xl font-bold mt-1">{page.title}</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-3xl">{page.intro}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {page.sections.map((section) => (
          <Card key={section.title} className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">{section.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}