import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { fetchPublicSettings } from "@/api/publicSettingsApi";

export default function PromoBanner() {
  const { data } = useQuery({
    queryKey: ["public-settings", "marketing-banner"],
    queryFn: fetchPublicSettings,
    staleTime: 60_000,
  });

  const isActive = Boolean(data?.promo_banner_active);
  const text = (data?.promo_banner_text || "").trim();

  if (!isActive || !text) return null;

  return (
    <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-orange-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-center">
          <Megaphone className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{text}</span>
        </p>
      </div>
    </div>
  );
}
