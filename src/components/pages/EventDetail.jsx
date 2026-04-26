import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent, listEvents } from "@/api/eventsApi";
import { listRegistrations } from "@/api/registrationsApi";
import { tokenStore } from "@/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, Calendar, Users, ArrowLeft, Clock, Tag,
  Share2, ExternalLink, CheckCircle2, User, Phone, Mail, Heart
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCategoryLabel, getCategoryIcon } from "@/lib/constants";
import RegistrationForm from "@/components/events/RegistrationForm";
import EventFeedbackForm from "@/components/events/EventFeedbackForm";
import EventCard from "@/components/events/EventCard";
import { motion } from "framer-motion";
import { addFavoriteEvent, isFavoriteEvent, removeFavoriteEvent } from "@/lib/participantSession";
import { toast } from "sonner";

const defaultImages = {
  concert: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80",
  sport: "https://images.unsplash.com/photo-1461896836934-bd45ba7c88c4?w=1200&q=80",
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
  festival: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80",
  formation: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80",
  atelier: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&q=80",
  networking: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80",
  autre: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
};

function InfoTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/40">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const events = [await getEvent(id)];
      return events[0];
    },
    refetchOnMount: "always",
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ["event-registrations-count", id],
    queryFn: () => listRegistrations({ event_id: id }),
    enabled: Boolean(id && tokenStore.getActiveToken()),
  });

  const { data: relatedEvents = [] } = useQuery({
    queryKey: ["related-events", event?.category],
    queryFn: () => listEvents({ status: "publie", sort: "-date_start", limit: 3 }),
    enabled: Boolean(event?.category),
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers !");
    }
  };

  useEffect(() => {
    if (!id) return;
    setIsFavorite(isFavoriteEvent(id));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Événement introuvable</h2>
        <Link to="/events">
          <Button variant="outline" className="rounded-full">Retour aux événements</Button>
        </Link>
      </div>
    );
  }

  const imageUrl = event.image_url || defaultImages[event.category] || defaultImages.autre;
  const isFree = !event.price || event.price === 0;
  const validatedCount = registrations.filter((r) => r.status === "validee" || r.status === "en_attente").length;
  const spotsPercent = event.max_participants
    ? Math.min((validatedCount / event.max_participants) * 100, 100)
    : null;
  const spotsLeft = event.max_participants ? event.max_participants - validatedCount : null;
  const related = relatedEvents.filter((e) => e.id !== event.id).slice(0, 3);

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFavoriteEvent(event.id);
      setIsFavorite(false);
      toast.success("Événement retiré des favoris.");
      return;
    }

    addFavoriteEvent(event);
    setIsFavorite(true);
    toast.success("Événement ajouté à vos favoris.");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour aux événements
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={handleToggleFavorite}>
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current text-red-500" : ""}`} />
            {isFavorite ? "Favori" : "Ajouter aux favoris"}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> Partager
          </Button>
        </div>
      </div>

      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden h-64 sm:h-80 md:h-96 mb-8"
      >
        <img src={imageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm">
              {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
            </Badge>
            {event.city && (
              <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm gap-1">
                <MapPin className="w-3 h-3" /> {event.city}
              </Badge>
            )}
          </div>
          {isFree ? (
            <Badge className="bg-emerald-500 text-white border-0 text-sm font-bold px-3 py-1">Gratuit</Badge>
          ) : (
            <Badge className="bg-primary text-primary-foreground border-0 text-sm font-bold px-3 py-1">
              {event.price?.toLocaleString()} FCFA
            </Badge>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div>
            <h1 className="text-3xl font-extrabold mb-2">{event.title}</h1>
            {event.organizer_name && (
              <p className="text-muted-foreground text-sm">
                Organisé par <span className="font-semibold text-foreground">{event.organizer_name}</span>
              </p>
            )}
          </div>

          {/* Info tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoTile
              icon={Calendar}
              label="Date"
              value={event.date_start ? format(new Date(event.date_start), "EEEE d MMMM yyyy", { locale: fr }) : "-"}
            />
            <InfoTile
              icon={Clock}
              label="Heure"
              value={event.date_start ? format(new Date(event.date_start), "HH:mm", { locale: fr }) : "-"}
              sub={event.date_end ? `Jusqu'à ${format(new Date(event.date_end), "HH:mm", { locale: fr })}` : undefined}
            />
            <InfoTile
              icon={MapPin}
              label="Lieu"
              value={event.location_name || event.city || "-"}
              sub={event.address}
            />
            {event.max_participants && (
              <InfoTile
                icon={Users}
                label="Places disponibles"
                value={spotsLeft !== null ? `${spotsLeft} place${spotsLeft !== 1 ? "s" : ""} restante${spotsLeft !== 1 ? "s" : ""}` : `${event.max_participants} max`}
              />
            )}
          </div>

          {/* Spots progress bar */}
          {spotsPercent !== null && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{validatedCount} inscrits</span>
                <span>{event.max_participants} places max</span>
              </div>
              <Progress value={spotsPercent} className="h-2" />
              {spotsPercent >= 80 && (
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {spotsPercent >= 100 ? "Complet" : "Places limitées — inscrivez-vous vite !"}
                </p>
              )}
            </div>
          )}

          <Tabs defaultValue="description">
            <TabsList className="rounded-full">
              <TabsTrigger value="description" className="rounded-full">Description</TabsTrigger>
              <TabsTrigger value="organisateur" className="rounded-full">Organisateur</TabsTrigger>
              <TabsTrigger value="avis" className="rounded-full">Avis</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4 space-y-4">
              {event.description && (
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
              )}
              {event.tags && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {event.tags.split(",").map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 rounded-full">
                      <Tag className="w-3 h-3" /> {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="organisateur" className="mt-4">
              <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{event.organizer_name || "Organisateur"}</p>
                    <p className="text-xs text-muted-foreground">Organisateur de l'événement</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {event.organizer_email && (
                    <a href={`mailto:${event.organizer_email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-4 h-4" /> {event.organizer_email}
                    </a>
                  )}
                  {event.organizer_phone && (
                    <a href={`tel:${event.organizer_phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-4 h-4" /> {event.organizer_phone}
                    </a>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="avis" className="mt-4">
              <EventFeedbackForm event={event} />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="sticky top-24 space-y-4">
            <RegistrationForm event={event} />

            {/* Share widget */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 space-y-3">
              <p className="text-sm font-semibold">Partager cet événement</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 rounded-full text-xs"
                  onClick={handleShare}
                >
                  <Share2 className="w-3.5 h-3.5" /> Copier le lien
                </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${event.title} — ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-2 rounded-full text-xs">
                    <ExternalLink className="w-3.5 h-3.5" /> WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related events */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Événements similaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((e, i) => <EventCard key={e.id} event={e} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
