import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchTestimonials } from "@/api/testimonialsApi";

const FALLBACK = [
  {
    id: "1", name: "Amara Diallo", role: "Organisatrice formations", city: "Dakar", emoji: "🎤",
    quote: "EventFlow a transformé la façon dont nous gérons nos formations. Plus simple, plus de participants, plus de revenus.",
    stars: 5,
  },
  {
    id: "2", name: "Kwame Mensah", role: "Producteur musical", city: "Lagos", emoji: "🎵",
    quote: "Billets vendus en 24h, participants du Ghana, Cameroun, Bénin. La plateforme est vraiment pan-africaine.",
    stars: 5,
  },
  {
    id: "3", name: "Zainab Hassan", role: "CEO, Tech Summit Africa", city: "Abuja", emoji: "💼",
    quote: "Dashboard incroyable. Analytics, revenus, check-in QR. C'est tout ce qu'il nous fallait pour nos conférences.",
    stars: 5,
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay },
});

export default function TestimonialsSection() {
  const { data } = useQuery({
    queryKey: ["testimonials-public"],
    queryFn: fetchTestimonials,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const items = data?.length ? data : FALLBACK;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <Badge variant="secondary" className="mb-3">Témoignages</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Ils font confiance à EventFlow
          </h2>
          <p className="text-muted-foreground">
            Rejoignez les organisateurs qui transforment leurs événements
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <motion.div key={t.id} {...fadeUp(i * 0.1)}>
              <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed flex-1 mb-5">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                  <div className="text-3xl">{t.emoji}</div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                    {t.city && <p className="text-xs text-primary font-medium">{t.city}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
