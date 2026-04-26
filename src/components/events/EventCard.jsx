import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCategoryIcon, getCategoryLabel } from "@/lib/constants";
import { motion } from "framer-motion";
import FavoriteEventButton from "@/components/participant/FavoriteEventButton";

const defaultImages = {
  concert: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
  sport: "https://images.unsplash.com/photo-1461896836934-bd45ba7c88c4?w=600&q=80",
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  festival: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
  atelier: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80",
  exposition: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600&q=80",
  theatre: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80",
  networking: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=600&q=80",
  formation: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",
  autre: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
};

function GridCard({ event, index }) {
  const imageUrl = event.image_url || defaultImages[event.category] || defaultImages.autre;
  const isFree = !event.price || event.price === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link to={`/events/${event.id}`}>
        <Card className="group overflow-hidden border border-border/50 hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer bg-card h-full">
          <div className="relative h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <FavoriteEventButton
              event={event}
              className="absolute top-3 right-3 h-8 w-8 rounded-full border-0 bg-black/55 text-white hover:bg-black/75"
            />
            {/* Bottom badges on image */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
              <Badge className="bg-black/60 text-white border-0 backdrop-blur-sm text-xs">
                {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
              </Badge>
              {isFree ? (
                <Badge className="bg-emerald-500 text-white border-0 text-xs font-semibold">Gratuit</Badge>
              ) : (
                <Badge className="bg-primary text-primary-foreground border-0 text-xs font-semibold">
                  {event.price?.toLocaleString()} FCFA
                </Badge>
              )}
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3">
            <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {event.title}
            </h3>

            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {event.date_start && format(new Date(event.date_start), "d MMM yyyy · HH:mm", { locale: fr })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{event.location_name || event.city}</span>
              </div>
              {event.max_participants && (
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{event.max_participants} places max</span>
                </div>
              )}
            </div>

            {event.organizer_name && (
              <p className="text-xs text-muted-foreground border-t border-border/40 pt-2 mt-auto">
                Par <span className="font-medium text-foreground">{event.organizer_name}</span>
              </p>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function ListCard({ event, index }) {
  const imageUrl = event.image_url || defaultImages[event.category] || defaultImages.autre;
  const isFree = !event.price || event.price === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link to={`/events/${event.id}`}>
        <Card className="group overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-4 p-3">
            <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl overflow-hidden shrink-0">
              <img src={imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                {isFree ? (
                  <Badge className="bg-emerald-500 text-white border-0 text-xs shrink-0">Gratuit</Badge>
                ) : (
                  <Badge className="bg-primary text-primary-foreground border-0 text-xs shrink-0">
                    {event.price?.toLocaleString()} F
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {event.date_start && format(new Date(event.date_start), "d MMM yyyy", { locale: fr })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.city}
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  {getCategoryIcon(event.category)} {getCategoryLabel(event.category)}
                </span>
              </div>
            </div>
            <FavoriteEventButton event={event} size="sm" variant="ghost" className="h-8 px-2 shrink-0" />
            <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function EventCard({ event, index = 0, listMode = false }) {
  if (listMode) return <ListCard event={event} index={index} />;
  return <GridCard event={event} index={index} />;
}
