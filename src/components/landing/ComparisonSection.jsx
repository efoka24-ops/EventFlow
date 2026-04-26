import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";

const organizerFeatures = [
  "Créer & publier un événement",
  "Billets digitaux avec QR Code",
  "Paiement Mobile Money",
  "Dashboard participants",
  "Check-in QR Code le jour J",
  "Analytics & statistiques",
  "Export Excel des données",
  "Support en français",
];

const participantFeatures = [
  "Découvrir des événements",
  "S'inscrire en 1 clic",
  "Billet digital sur téléphone",
  "Historique de mes billets",
  "Transfert de billet",
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay },
});

export default function ComparisonSection() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <Badge variant="secondary" className="mb-3">Pour tout le monde</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Organisateur ou Participant ?
          </h2>
          <p className="text-muted-foreground">
            EventFlow s'adapte à votre rôle
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Organisateur */}
          <motion.div {...fadeUp(0.1)}>
            <div className="p-6 rounded-2xl bg-card border-2 border-primary/40 shadow-lg h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🎤</span>
                <div>
                  <h3 className="text-xl font-bold">Organisateur</h3>
                  <p className="text-xs text-muted-foreground">Gérez vos événements pro</p>
                </div>
              </div>
              <div className="space-y-3 flex-1 mb-6">
                {organizerFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/submit-event" className="block">
                <Button className="w-full gap-2 rounded-full">
                  Créer mon événement <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Participant */}
          <motion.div {...fadeUp(0.2)}>
            <div className="p-6 rounded-2xl bg-card border-2 border-accent/40 shadow-lg h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🎟️</span>
                <div>
                  <h3 className="text-xl font-bold">Participant</h3>
                  <p className="text-xs text-muted-foreground">Vivez des expériences uniques</p>
                </div>
              </div>
              <div className="space-y-3 flex-1 mb-6">
                {participantFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/events" className="block">
                <Button variant="outline" className="w-full gap-2 rounded-full border-accent/50 text-accent hover:bg-accent/5">
                  Explorer les événements <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
