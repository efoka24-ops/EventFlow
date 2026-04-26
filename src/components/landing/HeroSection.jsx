import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Search, CalendarDays, Users, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchPublicSettings } from "@/api/publicSettingsApi";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: "easeOut" },
});

export default function HeroSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { data: publicSettings } = useQuery({
    queryKey: ["public-settings", "homepage-hero"],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  });

  const heroTitle = (publicSettings?.homepage_hero_title || "").trim() || "Créez des événements\nqui marquent les esprits";
  const heroSubtitle =
    (publicSettings?.homepage_hero_subtitle || "").trim() ||
    "Billets digitaux, paiement Mobile Money, check-in QR Code. La solution tout-en-un pensée pour le marché africain.";
  const [heroTitleLine1, ...heroTitleLine2Parts] = heroTitle.split("\n");
  const heroTitleLine2 = heroTitleLine2Parts.join(" ").trim();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/events${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 min-h-[88vh] flex items-center">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto">

          {/* <motion.div {...fadeUp(0)}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <Sparkles className="w-3.5 h-3.5" />
              La plateforme événementielle africaine
            </div>
          </motion.div> */}

          <motion.h1 {...fadeUp(0.1)} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            {heroTitleLine1}
            {heroTitleLine2 && (
              <span className="text-primary block mt-1">{heroTitleLine2}</span>
            )}
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {heroSubtitle}
          </motion.p>

          {/* Search bar */}
          <motion.form {...fadeUp(0.3)} onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chercher un événement, une ville..."
                className="pl-11 h-12 rounded-full text-sm border-border/60 bg-background/80"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-full px-6 gap-2 shadow-sm shrink-0">
              Rechercher <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.form>

          <motion.div {...fadeUp(0.35)} className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link to="/submit-event">
              <Button size="lg" className="gap-2 rounded-full px-8 shadow-md">
                Créer un événement <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline" className="gap-2 rounded-full px-8">
                Explorer les événements
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeUp(0.45)} className="grid grid-cols-3 gap-6 pt-8 border-t border-border/40 max-w-lg mx-auto">
            {[
              { value: "500+", label: "Événements", icon: CalendarDays },
              { value: "12K+", label: "Participants", icon: Users },
              { value: "30+", label: "Villes", icon: MapPin },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="flex justify-center mb-1">
                  <Icon className="w-4 h-4 text-primary/60" />
                </div>
                <div className="text-2xl font-extrabold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
