import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Decorative */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium mb-6 border border-white/20">
            <Zap className="w-3.5 h-3.5" />
            Gratuit pour commencer
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Votre prochain grand événement commence ici
          </h2>

          <p className="text-primary-foreground/80 mb-10 max-w-xl mx-auto text-lg">
            Rejoignez des centaines d'organisateurs qui font confiance à EventFlow en Afrique.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/submit-event">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 rounded-full px-8 text-primary font-semibold shadow-lg"
              >
                Créer un événement gratuitement
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/events">
              <Button
                size="lg"
                variant="ghost"
                className="gap-2 rounded-full px-8 border border-white/20 text-primary-foreground hover:bg-white/10"
              >
                Explorer les événements
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
