import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar, DollarSign } from "lucide-react";
import FavoriteEventButton from "@/components/participant/FavoriteEventButton";

export default function EventCardModern({ event, onClick }) {
  const isFree = !event.price || event.price === 0;
  const isPublished = event.status === "published" || event.status === "publie";
  const statusColor = isPublished ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800";

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr || "Date non spécifiée";
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-4xl">
            🎉
          </div>
        )}
        <div className="absolute top-3 left-3">
          <FavoriteEventButton
            event={event}
            className="h-8 w-8 rounded-full border-0 bg-white/85 hover:bg-white"
          />
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge className={statusColor}>{event.status}</Badge>
          {isFree && <Badge variant="secondary">Gratuit</Badge>}
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 text-lg">{event.title}</CardTitle>
        <Badge variant="outline" className="w-fit mt-2">
          {event.category}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 pb-4">
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {event.description || "Pas de description"}
        </p>

        {/* Meta Info */}
        <div className="space-y-3 pt-2 border-t">
          {event.date_start && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700 font-medium">
                {formatDate(event.date_start)}
              </span>
            </div>
          )}

          {event.city && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-red-600" />
              <span className="text-gray-700 font-medium">{event.city}</span>
            </div>
          )}

          {event.max_participants && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-gray-700 font-medium">
                {event.max_participants} places max
              </span>
            </div>
          )}

          {event.price && event.price > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-600">
                {Math.floor(event.price).toLocaleString()} FCFA
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
