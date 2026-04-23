import { listEvents } from "@/api/eventsApi";
import { useQuery } from "@tanstack/react-query";
import EventCard from "./EventCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedEvents() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["featured-events"],
    queryFn: () => listEvents({ status: "publie", sort: "-created_date", limit: 6 }),
    refetchOnMount: "always",
  });

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Événements à la une</h2>
          <p className="text-muted-foreground mt-1">Les derniers événements publiés</p>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Aucun événement publié pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}