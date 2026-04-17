import React from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Users, ArrowLeft, Clock, Tag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCategoryLabel } from "@/lib/constants";
import RegistrationForm from "@/components/events/RegistrationForm";
import EventFeedbackForm from "@/components/events/EventFeedbackForm";
import { motion } from "framer-motion";

const defaultImages = {
  concert: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80",
  sport: "https://images.unsplash.com/photo-1461896836934-bd45ba7c88c4?w=1200&q=80",
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
  festival: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80",
  autre: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
};

export default function EventDetail() {
  const { id } = useParams();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const events = await base44.entities.Event.filter({ id });
      return events[0];
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Événement introuvable</h2>
        <Link to="/events">
          <Button variant="outline">Retour aux événements</Button>
        </Link>
      </div>
    );
  }

  const imageUrl = event.image_url || defaultImages[event.category] || defaultImages.autre;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour aux événements
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="relative rounded-2xl overflow-hidden h-64 md:h-80">
            <img src={imageUrl} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Badge className="bg-card/90 text-foreground backdrop-blur-sm border-0">
                {getCategoryLabel(event.category)}
              </Badge>
              {(event.price === 0 || !event.price) ? (
                <Badge className="bg-emerald-500 text-white border-0">Gratuit</Badge>
              ) : (
                <Badge className="bg-primary text-primary-foreground border-0">
                  {event.price?.toLocaleString()} FCFA
                </Badge>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold mb-4">{event.title}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-semibold">
                      {event.date_start && format(new Date(event.date_start), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Heure</p>
                    <p className="text-sm font-semibold">
                      {event.date_start && format(new Date(event.date_start), "HH:mm", { locale: fr })}
                      {event.date_end && ` - ${format(new Date(event.date_end), "HH:mm", { locale: fr })}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lieu</p>
                    <p className="text-sm font-semibold">{event.location_name || event.city}</p>
                    {event.address && <p className="text-xs text-muted-foreground">{event.address}</p>}
                  </div>
                </CardContent>
              </Card>
              {event.max_participants && (
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Places</p>
                      <p className="text-sm font-semibold">{event.max_participants} participants max</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {event.description && (
              <div>
                <h2 className="text-lg font-bold mb-3">Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {event.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {event.tags.split(",").map((tag, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    <Tag className="w-3 h-3" /> {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}

            <div className="pt-4">
              <EventFeedbackForm event={event} />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="sticky top-24">
            <RegistrationForm event={event} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}