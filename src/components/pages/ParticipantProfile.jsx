import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyTickets } from "@/api/registrationsApi";
import { getFavoriteEvents, getParticipantEmail } from "@/lib/participantSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Ticket, Heart, CalendarDays, ArrowRight, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ParticipantProfile() {
  const participantEmail = getParticipantEmail();
  const [favoriteEvents, setFavoriteEvents] = useState(() => getFavoriteEvents());

  useEffect(() => {
    const refreshFavorites = () => setFavoriteEvents(getFavoriteEvents());
    window.addEventListener("participant-session-changed", refreshFavorites);
    window.addEventListener("storage", refreshFavorites);
    window.addEventListener("focus", refreshFavorites);
    return () => {
      window.removeEventListener("participant-session-changed", refreshFavorites);
      window.removeEventListener("storage", refreshFavorites);
      window.removeEventListener("focus", refreshFavorites);
    };
  }, []);

  const { data: tickets = [] } = useQuery({
    queryKey: ["participant-profile-tickets", participantEmail],
    queryFn: () => getMyTickets(participantEmail),
    enabled: Boolean(participantEmail),
  });

  const upcomingTickets = useMemo(() => {
    const now = Date.now();
    return tickets.filter((ticket) => ticket.date_start && new Date(ticket.date_start).getTime() >= now);
  }, [tickets]);

  if (!participantEmail) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="border-border/50">
          <CardContent className="py-12 text-center space-y-4">
            <User className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <div>
              <h1 className="text-2xl font-bold">Profil participant</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Votre profil implicite sera créé automatiquement après votre première inscription.
              </p>
            </div>
            <Link to="/events">
              <Button className="rounded-full">Explorer les événements</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Card className="border-border/50">
        <CardContent className="pt-6 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Profil participant</p>
              <h1 className="text-2xl font-bold">Mini espace personnel</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5" /> {participantEmail}
              </p>
            </div>
          </div>
          <Link to="/participant/tickets">
            <Button className="rounded-full gap-2">
              <Ticket className="w-4 h-4" /> Voir mes billets
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-extrabold">{tickets.length}</p><p className="text-xs text-muted-foreground">Billets</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-extrabold text-primary">{favoriteEvents.length}</p><p className="text-xs text-muted-foreground">Favoris</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="pt-4 pb-3 text-center"><p className="text-2xl font-extrabold text-emerald-600">{upcomingTickets.length}</p><p className="text-xs text-muted-foreground">À venir</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Prochains événements</CardTitle></CardHeader>
          <CardContent>
            {upcomingTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement à venir.</p>
            ) : (
              <div className="space-y-3">
                {upcomingTickets.slice(0, 4).map((ticket) => (
                  <div key={ticket.id} className="p-3 rounded-xl border border-border/50">
                    <p className="font-semibold text-sm">{ticket.event_title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ticket.date_start ? format(new Date(ticket.date_start), "dd MMM yyyy", { locale: fr }) : "Date non définie"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Favoris sauvegardés</CardTitle></CardHeader>
          <CardContent>
            {favoriteEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun favori enregistré.</p>
            ) : (
              <div className="space-y-3">
                {favoriteEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50">
                    <div>
                      <p className="font-semibold text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.city || "Ville non précisée"}</p>
                    </div>
                    <Link to={`/events/${event.id}`}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        Voir <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
