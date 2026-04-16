import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCategoryIcon } from "@/lib/constants";
import { motion } from "framer-motion";

const defaultImages = {
  concert: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
  sport: "https://images.unsplash.com/photo-1461896836934-bd45ba7c88c4?w=600&q=80",
  conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  festival: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80",
  atelier: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80",
  exposition: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=600&q=80",
  theatre: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80",
  cinema: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
  gastronomie: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  bien_etre: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80",
  technologie: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80",
  autre: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80",
};

export default function EventCard({ event, index = 0 }) {
  const imageUrl = event.image_url || defaultImages[event.category] || defaultImages.autre;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/events/${event.id}`}>
        <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer">
          <div className="relative h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <Badge className="absolute top-3 left-3 bg-card/90 text-foreground backdrop-blur-sm border-0">
              {getCategoryIcon(event.category)} {event.category}
            </Badge>
            {event.price === 0 || !event.price ? (
              <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0">
                Gratuit
              </Badge>
            ) : (
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground border-0">
                {event.price?.toLocaleString()} FCFA
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {event.date_start && format(new Date(event.date_start), "d MMM yyyy · HH:mm", { locale: fr })}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="truncate">{event.location_name || event.city}</span>
              </div>
              {event.max_participants && (
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {event.max_participants} places
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}