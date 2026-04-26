import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listEvents } from "@/api/eventsApi";
import { toggleEventFeatured, approveEvent } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Store, Star, CheckCircle2, Eye, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fmtDate = (d) => d ? format(new Date(d), "d MMM yyyy", { locale: fr }) : "—";
const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");

export default function AdminMarketplace() {
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => listEvents({ sort: "-created_date", limit: 200 }),
    staleTime: 30_000,
  });

  const featuredMut = useMutation({
    mutationFn: (id) => toggleEventFeatured(id),
    onSuccess: (data) => {
      toast.success(data.is_featured ? "Événement mis en avant" : "Événement retiré de la une");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const publishedEvents = events.filter((e) => e.status === "publie");
  const featuredEvents = events.filter((e) => e.is_featured);
  const pendingEvents = events.filter((e) => e.approval_status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketplace Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Contrôlez les événements mis en avant et les recommandations</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Événements publiés", value: fmt(publishedEvents.length), icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
          { label: "Mis en avant", value: fmt(featuredEvents.length), icon: Star, color: "bg-amber-100 text-amber-700" },
          { label: "En attente d'approbation", value: fmt(pendingEvents.length), icon: Eye, color: "bg-blue-100 text-blue-700" },
          { label: "Total événements", value: fmt(events.length), icon: Store, color: "bg-violet-100 text-violet-700" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Événements en vedette */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />Événements mis en avant
            <Badge className="bg-amber-100 text-amber-700 border-0">{featuredEvents.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {featuredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun événement mis en avant</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featuredEvents.map((e) => (
                <div key={e.id} className="relative group rounded-xl overflow-hidden border bg-muted/30 hover:bg-muted/50 transition-colors">
                  {e.image_url && (
                    <div className="h-24 bg-muted overflow-hidden">
                      <img src={e.image_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.city} · {fmtDate(e.date_start)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0">{e.category}</Badge>
                      <Switch
                        checked={e.is_featured}
                        onCheckedChange={() => featuredMut.mutate(e.id)}
                        disabled={featuredMut.isPending}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tous les événements publiés avec toggle featured */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />Gérer la mise en avant
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {publishedEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                  {e.image_url ? (
                    <img src={e.image_url} alt={e.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.city} · {e.category} · {fmtDate(e.date_start)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.is_featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    <Switch
                      checked={!!e.is_featured}
                      onCheckedChange={() => featuredMut.mutate(e.id)}
                      disabled={featuredMut.isPending}
                    />
                  </div>
                </div>
              ))}
              {publishedEvents.length === 0 && (
                <p className="text-center py-6 text-muted-foreground text-sm">Aucun événement publié</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
