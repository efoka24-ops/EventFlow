import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export default function EventFilters({ filters, onFilterChange, onReset }) {
  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasFilters = filters.search || filters.category !== "all" || filters.city;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 md:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Filtres</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="ml-auto text-xs gap-1">
            <X className="w-3 h-3" /> Réinitialiser
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filters.category || "all"} onValueChange={(v) => updateFilter("category", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.icon} {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ville..."
            value={filters.city || ""}
            onChange={(e) => updateFilter("city", e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}