import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const faqs = [
  {
    q: "Comment créer un événement ?",
    a: "Cliquez sur « Créer un événement », remplissez le formulaire (titre, date, lieu, prix) et validez. Votre événement est publié en moins de 5 minutes.",
  },
  {
    q: "Quels moyens de paiement supportez-vous ?",
    a: "Nous supportons MTN Mobile Money, Orange Money et Wave. Tous les paiements sont sécurisés. Les événements gratuits ne nécessitent aucun paiement.",
  },
  {
    q: "Comment fonctionne le système de billets QR ?",
    a: "Chaque participant reçoit un billet digital avec un QR code unique. Le jour J, l'organisateur scanne les codes depuis son téléphone pour valider les entrées en temps réel.",
  },
  {
    q: "Combien coûte EventFlow ?",
    a: "La création de compte et la publication d'événements est totalement gratuite. Une commission est prélevée uniquement sur les transactions de billets payants.",
  },
  {
    q: "Puis-je exporter la liste des participants ?",
    a: "Oui, vous pouvez exporter la liste complète des participants en format Excel depuis votre dashboard, avec toutes les données de contact.",
  },
  {
    q: "Quel est le support client ?",
    a: "Support en français par email et WhatsApp. Nous répondons en moins de 2h en jours ouvrés.",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay },
});

export default function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <Badge variant="secondary" className="mb-3">FAQ</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground">
            Tout ce que vous devez savoir sur EventFlow
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.1)}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border/50 rounded-xl px-5 overflow-hidden data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-sm font-semibold text-left hover:no-underline py-4">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-3">Vous avez d'autres questions ?</p>
          <Link to="/help">
            <Button variant="outline" className="gap-2 rounded-full">
              Consulter le centre d'aide <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
