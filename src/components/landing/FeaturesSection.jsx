import { motion } from "framer-motion";
import { Zap, CreditCard, Users, BarChart3, Smartphone, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Zap,
    title: "Création rapide",
    description: "Créez un événement en moins de 5 minutes. Interface intuitive, formulaire guidé.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: CreditCard,
    title: "Paiements flexibles",
    description: "MTN MoMo, Orange Money, Wave. Tous les moyens de paiement africains acceptés.",
    color: "text-violet-500 bg-violet-500/10",
  },
  {
    icon: Users,
    title: "Gestion simplifiée",
    description: "Inscriptions, présence, billets. Tout centralisé dans un dashboard clair.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Analytics en direct",
    description: "Revenus, taux d'inscription, démographie. Données temps réel pour décider.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Expérience parfaite sur tous les appareils. Billets digitaux avec QR unique.",
    color: "text-sky-500 bg-sky-500/10",
  },
  {
    icon: Globe,
    title: "Pan-africain",
    description: "Multilingue, adapté au marché local. Pensé pour l'Afrique dès le départ.",
    color: "text-teal-500 bg-teal-500/10",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay },
});

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <Badge variant="secondary" className="mb-3">Fonctionnalités</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Pourquoi choisir EventFlow ?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Une plateforme complète pensée pour les organisateurs africains
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description, color }, i) => (
            <motion.div key={title} {...fadeUp(i * 0.07)}>
              <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
