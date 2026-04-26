import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addFavoriteEvent, isFavoriteEvent, removeFavoriteEvent } from "@/lib/participantSession";
import { toast } from "sonner";

export default function FavoriteEventButton({ event, size = "icon", className = "", variant = "secondary" }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!event?.id) return;
    setIsFavorite(isFavoriteEvent(event.id));
  }, [event?.id]);

  const handleToggle = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();

    if (!event?.id) return;

    if (isFavorite) {
      removeFavoriteEvent(event.id);
      setIsFavorite(false);
      toast.success("Événement retiré des favoris.");
      return;
    }

    addFavoriteEvent(event);
    setIsFavorite(true);
    toast.success("Événement ajouté aux favoris.");
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={handleToggle}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart className={`w-4 h-4 ${isFavorite ? "fill-current text-red-500" : ""}`} />
    </Button>
  );
}
