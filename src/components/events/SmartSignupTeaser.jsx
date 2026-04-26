import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Smartphone, Mail, ArrowRight, Ticket } from "lucide-react";

const perks = [
  { icon: Mail, label: "Inscription par email" },
  { icon: Smartphone, label: "Paiement Mobile Money" },
  { icon: ShieldCheck, label: "Billet QR sécurisé" },
  { icon: Ticket, label: "Historique des billets" },
];

export default function SmartSignupTeaser() {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-5">
      <div>
        <p className="font-bold text-base mb-1">Connectez-vous pour vous inscrire</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Un compte est requis pour enregistrer votre inscription, recevoir votre billet digital et accélérer vos prochains paiements.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {perks.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <Link to="/submit-event?auth=login" className="block">
          <Button variant="outline" className="w-full gap-2 rounded-full">
            Se connecter
          </Button>
        </Link>
        <Link to="/submit-event?auth=signup" className="block">
          <Button className="w-full gap-2 rounded-full">
            Créer un compte <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
