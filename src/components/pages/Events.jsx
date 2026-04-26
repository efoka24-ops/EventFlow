import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { listEvents } from "@/api/eventsApi";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import EventCard from "@/components/events/EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";
import { Search, MapPin, SlidersHorizontal, X, CalendarDays, LayoutGrid, List } from "lucide-react";

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState("grid");

  const [filters, setFilters] = useState({
    search: searchParams.get("q") || "",
    category: searchParams.get("category") || "all",
    city: searchParams.get("city") || "",
    price: "all",
    sort: "-date_start",
  });

  useEffect(() => {
    const params = {};
    if (filters.search) params.q = filters.search;
    if (filters.category !== "all") params.category = filters.category;
    if (filters.city) params.city = filters.city;
    setSearchParams(params, { replace: true });
  }, [filters.search, filters.category, filters.city]);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents({ status: "publie", sort: "-date_start" }),
    refetchOnMount: "always",
  });

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const filteredEvents = useMemo(() => {
    let result = events.filter((e) => {
      const q = filters.search.toLowerCase();
      const matchSearch = !q ||
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q);
      const matchCat = filters.category === "all" || e.category === filters.category;
      const matchCity = !filters.city ||
        e.city?.toLowerCase().includes(filters.city.toLowerCase());
      const matchPrice = filters.price === "all"
        ? true
        : filters.price === "gratuit"
          ? !e.price || e.price === 0
          : e.price > 0;
      return matchSearch && matchCat && matchCity && matchPrice;
    });

    if (filters.sort === "-date_start") result = [...result].sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
    else if (filters.sort === "date_start") result = [...result].sort((a, b) => new Date(b.date_start) - new Date(a.date_start));
    else if (filters.sort === "-created_date") result = [...result].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    return result;
  }, [events, filters]);

  const activeFilterCount = [
    filters.search,
    filters.category !== "all",
    filters.city,
    filters.price !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => setFilters({ search: "", category: "all", city: "", price: "all", sort: "-date_start" });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Explorer les événements</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Chargement..." : `${filteredEvents.length} événement${filteredEvents.length !== 1 ? "s" : ""} trouvé${filteredEvents.length !== 1 ? "s" : ""}`}
            {activeFilterCount > 0 && (
              <span className="ml-2 text-primary">· {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""} actif{activeFilterCount > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Filtres</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">{activeFilterCount}</Badge>
          )}
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto gap-1 text-xs h-7">
              <X className="w-3 h-3" /> Réinitialiser
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Chercher un événement..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ville..."
              value={filters.city}
              onChange={(e) => updateFilter("city", e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filters.price} onValueChange={(v) => updateFilter("price", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Prix" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les prix</SelectItem>
              <SelectItem value="gratuit">Gratuit</SelectItem>
              <SelectItem value="payant">Payant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Active filters chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {filters.search && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter("search", "")}>
                "{filters.search}" <X className="w-3 h-3" />
              </Badge>
            )}
            {filters.category !== "all" && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter("category", "all")}>
                {CATEGORIES.find((c) => c.value === filters.category)?.icon} {filters.category} <X className="w-3 h-3" />
              </Badge>
            )}
            {filters.city && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter("city", "")}>
                📍 {filters.city} <X className="w-3 h-3" />
              </Badge>
            )}
            {filters.price !== "all" && (
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => updateFilter("price", "all")}>
                {filters.price === "gratuit" ? "Gratuit" : "Payant"} <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <CalendarDays className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-xl font-semibold mb-2">Aucun événement trouvé</p>
            <p className="text-muted-foreground text-sm mb-4">Essayez de modifier vos filtres</p>
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={resetFilters} className="gap-2 rounded-full">
                <X className="w-4 h-4" /> Effacer les filtres
              </Button>
            )}
          </motion.div>
        ) : viewMode === "grid" ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filteredEvents.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} listMode />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
