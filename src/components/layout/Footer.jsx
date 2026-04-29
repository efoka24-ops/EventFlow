import { Link } from "react-router-dom";
import { CalendarDays, Mail, MapPin, Twitter, Linkedin, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks = {
  plateforme: [
    { label: "Explorer les événements", to: "/events" },
    { label: "Créer un événement", to: "/submit-event" },
    { label: "Mes billets", to: "/participant/tickets" },
    { label: "Centre d'aide", to: "/help" },
    { label: "Guide d'utilisation", to: "/guide" },
    { label: "Nous contacter", to: "/contact" },
  ],
  organisateurs: [
    { label: "Soumettre un événement", to: "/submit-event" },
    { label: "Mon dashboard", to: "/dashboard" },
    { label: "Mes événements", to: "/dashboard/events" },
    { label: "Intégration paiement", to: "/help" },
  ],
  legal: [
    { label: "Conditions d'utilisation", to: "/legal/terms" },
    { label: "Politique de confidentialité", to: "/legal/privacy" },
    { label: "Cookies", to: "/legal/cookies" },
    { label: "Mentions légales", to: "/legal/notices" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40 backdrop-blur-sm">
      {/* CTA Banner */}
      <div className="border-b border-border/40 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1">Prêt à créer votre prochain événement ?</h3>
              <p className="text-sm text-muted-foreground">Gratuit, rapide et mobile-first. Plus de 500 événements gérés.</p>
            </div>
            <Link to="/submit-event">
              <Button className="gap-2 rounded-full px-6 shadow-sm shrink-0">
                Démarrer gratuitement
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">EventFlow</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              La plateforme de gestion d'événements pensée pour l'Afrique. Mobile-first, simple et puissante.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a href="#" className="w-8 h-8 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors">
                <Instagram className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {section === "plateforme" ? "Plateforme" : section === "organisateurs" ? "Organisateurs" : "Légal"}
              </h4>
              <ul className="space-y-2">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <p>© {new Date().getFullYear()} EventFlow. Tous droits réservés.</p>
            <span className="hidden sm:inline">·</span>
            <p className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Garoua, Cameroun
            </p>
          </div>
          <p className="flex items-center gap-1.5">
            <Mail className="w-3 h-3" /> eventlfow@trugroup.cm
          </p>
          <p className="flex items-center gap-1.5">
            <span className="w-3 h-3">📞</span> 678758976
          </p>
        </div>
      </div>
    </footer>
  );
}
