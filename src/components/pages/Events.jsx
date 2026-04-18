import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import EventCard from "@/components/events/EventCard";
import EventFilters from "@/components/events/EventFilters";
import { Skeleton } from "@/components/ui/skeleton";

export default function Events() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get("category") || "all";

  const [filters, setFilters] = useState({
    search: "",
    category: initialCategory,
    city: "",
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.Event.filter({ status: "publie" }, "-date_start"),
    refetchOnMount: "always",
  });

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSearch = !filters.search || 
        e.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        e.description?.toLowerCase().includes(filters.search.toLowerCase());
      const matchCategory = filters.category === "all" || e.category === filters.category;
      const matchCity = !filters.city || 
        e.city?.toLowerCase().includes(filters.city.toLowerCase());
      return matchSearch && matchCategory && matchCity;
    });
  }, [events, filters]);

  const resetFilters = () => setFilters({ search: "", category: "all", city: "" });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tous les événements</h1>
        <p className="text-muted-foreground">
          {filteredEvents.length} événement{filteredEvents.length !== 1 ? "s" : ""} trouvé{filteredEvents.length !== 1 ? "s" : ""}
        </p>
      </div>

      <EventFilters filters={filters} onFilterChange={setFilters} onReset={resetFilters} />

      <div className="mt-8">
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
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl font-semibold mb-2">Aucun événement trouvé</p>
            <p className="text-muted-foreground">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}