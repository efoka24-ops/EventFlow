import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listEvents } from "@/api/eventsApi";
import { getMyTickets } from "@/api/registrationsApi";
import { getFavoriteEvents, getParticipantEmail, removeFavoriteEvent, setParticipantEmail } from "@/lib/participantSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { REGISTRATION_STATUS } from "@/lib/constants";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, RefreshCcw, Ticket, Mail, MapPin, CalendarDays, Download, Search, CheckCircle2, Heart, Clock3, ArrowRight, BellRing, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { generateTicketPDF } from "@/utils/generateTicket";
import { motion, AnimatePresence } from "framer-motion";

export default function ParticipantTickets() {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || getParticipantEmail() || "";
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [searchedEmail, setSearchedEmail] = useState(initialEmail);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(Boolean(initialEmail));
  const [searched, setSearched] = useState(Boolean(initialEmail));
  const [ticketLoadingId, setTicketLoadingId] = useState(null);
  const [favoriteEvents, setFavoriteEvents] = useState(() => getFavoriteEvents());

  const { data: recommendedEvents = [] } = useQuery({
    queryKey: ["participant-recommendations"],
    queryFn: () => listEvents({ status: "publie", sort: "-created_date", limit: 12 }),
  });

  const fetchTickets = async (email) => {
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) {
      toast.error("Entrez un email valide.");
      return;
    }
    setLoading(true);
    setSearchedEmail(normalized);
    setSearched(true);
    try {
      const data = await getMyTickets(normalized);
      setParticipantEmail(normalized);
      setTickets(data || []);
    } catch {
      toast.error("Impossible de récupérer vos billets. Réessayez.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEmail) {
      fetchTickets(initialEmail);
    }
  }, [initialEmail]);

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

  const upcomingTickets = useMemo(() => {
    const now = Date.now();
    return [...tickets]
      .filter((ticket) => ticket.date_start && new Date(ticket.date_start).getTime() >= now)
      .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
  }, [tickets]);

  const pastTickets = useMemo(() => {
    const now = Date.now();
    return [...tickets]
      .filter((ticket) => !ticket.date_start || new Date(ticket.date_start).getTime() < now)
      .sort((a, b) => new Date(b.date_start || 0) - new Date(a.date_start || 0));
  }, [tickets]);

  const validatedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "validee").length,
    [tickets]
  );

  const nextUpcomingTicket = upcomingTickets[0] || null;

  const suggestedEvents = useMemo(() => {
    const ticketedEventIds = new Set(tickets.map((ticket) => ticket.event_id));
    const favoriteIds = new Set(favoriteEvents.map((event) => event.id));
    const preferredCategories = new Set(
      [...favoriteEvents, ...tickets]
        .map((item) => item.category || item.event_category)
        .filter(Boolean)
    );
    const preferredCities = new Set(
      [...favoriteEvents, ...tickets]
        .map((item) => item.city)
        .filter(Boolean)
    );

    return recommendedEvents
      .filter((event) => !ticketedEventIds.has(event.id))
      .sort((left, right) => {
        const leftScore =
          (favoriteIds.has(left.id) ? 1 : 0) +
          (preferredCategories.has(left.category) ? 2 : 0) +
          (preferredCities.has(left.city) ? 1 : 0);
        const rightScore =
          (favoriteIds.has(right.id) ? 1 : 0) +
          (preferredCategories.has(right.category) ? 2 : 0) +
          (preferredCities.has(right.city) ? 1 : 0);

        return rightScore - leftScore;
      })
      .slice(0, 4);
  }, [favoriteEvents, recommendedEvents, tickets]);

  const handleDownload = async (ticket) => {
    setTicketLoadingId(ticket.id);
    try {
      const event = {
        id: ticket.event_id,
        title: ticket.event_title,
        date_start: ticket.date_start,
        city: ticket.city,
        location_name: ticket.location_name,
        image_url: ticket.event_image,
        price: ticket.event_price,
        organizer_name: ticket.organizer_name,
      };
      await generateTicketPDF({ event, registration: ticket });
    } catch {
      toast.error("Impossible de générer le billet.");
    } finally {
      setTicketLoadingId(null);
    }
  };

  const statusColors = {
    validee: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    en_attente: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    en_attente_paiement: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    refusee: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Mes billets</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Entrez votre email pour retrouver tous vos billets EventFlow. Aucun compte nécessaire.
        </p>
      </div>

      {(searchedEmail || favoriteEvents.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/50 md:col-span-2">
            <CardContent className="pt-5 pb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Mini espace participant</p>
                <p className="text-base font-bold mt-1">{searchedEmail || getParticipantEmail() || "Visiteur"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vos billets sont mémorisés automatiquement après inscription. Pas de compte explicite requis.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge variant="secondary">Compte implicite</Badge>
                <Link to="/participant/profile">
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-full">
                    <User className="w-3.5 h-3.5" /> Voir mon profil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xl font-extrabold">{tickets.length}</p>
                <p className="text-xs text-muted-foreground">Billets</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xl font-extrabold text-emerald-600">{validatedCount}</p>
                <p className="text-xs text-muted-foreground">Validés</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-xl font-extrabold text-primary">{favoriteEvents.length}</p>
                <p className="text-xs text-muted-foreground">Favoris</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {(searchedEmail || tickets.length > 0 || favoriteEvents.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BellRing className="w-4 h-4 text-primary" /> Rappel participant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextUpcomingTicket ? (
                <>
                  <p className="font-semibold">Votre prochain événement est déjà planifié.</p>
                  <p className="text-sm text-muted-foreground">
                    {nextUpcomingTicket.event_title} le {nextUpcomingTicket.date_start ? format(new Date(nextUpcomingTicket.date_start), "dd MMM yyyy 'à' HH:mm", { locale: fr }) : "bientôt"}
                    {nextUpcomingTicket.city ? ` à ${nextUpcomingTicket.city}` : ""}.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pensez à télécharger votre billet PDF avant le jour J pour un accès plus rapide à l'entrée.
                  </p>
                </>
              ) : favoriteEvents.length > 0 ? (
                <>
                  <p className="font-semibold">Vous avez {favoriteEvents.length} événement(s) en veille.</p>
                  <p className="text-sm text-muted-foreground">
                    Finalisez votre prochaine sortie en ouvrant vos favoris ou en surveillant les nouvelles dates publiées.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Aucun rappel actif pour le moment.</p>
                  <p className="text-sm text-muted-foreground">
                    Inscrivez-vous à un événement ou ajoutez des favoris pour personnaliser cet espace automatiquement.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Recommandés pour vous
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Les recommandations apparaîtront dès que nous aurons plus d'indices sur vos goûts.
                </p>
              ) : (
                <div className="space-y-3">
                  {suggestedEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 p-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm line-clamp-1">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {[event.city, event.date_start ? format(new Date(event.date_start), "dd MMM yyyy", { locale: fr }) : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <Link to={`/events/${event.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs">
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
      )}

      {/* Email lookup */}
      <Card className="border-border/50">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTickets(emailInput)}
                placeholder="votre@email.com"
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => fetchTickets(emailInput)}
              disabled={loading}
              className="gap-2 rounded-full shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" /> Événements favoris
          </CardTitle>
        </CardHeader>
        <CardContent>
          {favoriteEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Aucun favori pour le moment. Ajoutez des événements depuis leur fiche détail.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favoriteEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="rounded-xl border border-border/50 p-3 flex items-start gap-3">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-2">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {[event.city, event.date_start ? format(new Date(event.date_start), "dd MMM yyyy", { locale: fr }) : null].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Link to={`/events/${event.id}`}>
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                          Voir <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => removeFavoriteEvent(event.id)}>
                        Retirer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
          </motion.div>
        )}

        {!loading && searched && tickets.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Ticket className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-semibold mb-1">Aucun billet trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Aucune inscription associée à <strong>{searchedEmail}</strong>.<br />
                  Vérifiez l'email utilisé lors de l'inscription.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!loading && tickets.length > 0 && (
          <motion.div key="tickets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <strong>{tickets.length}</strong> billet(s) pour <strong>{searchedEmail}</strong>
              </p>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => fetchTickets(searchedEmail)}>
                <RefreshCcw className="w-3.5 h-3.5" /> Actualiser
              </Button>
            </div>

            {upcomingTickets.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" /> À venir
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingTickets.map((ticket) => {
                    const sm = REGISTRATION_STATUS[ticket.status] || { label: ticket.status };
                    const colorClass = statusColors[ticket.status] || "bg-muted text-muted-foreground";
                    return (
                      <motion.div key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border-border/50 hover:shadow-md transition-shadow overflow-hidden">
                          <CardContent className="pt-4 pb-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-bold text-base leading-snug">{ticket.event_title || "Événement"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Réf. {ticket.id?.slice(-8)?.toUpperCase()}</p>
                              </div>
                              <Badge className={`${colorClass} text-xs shrink-0`}>{sm.label}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              {ticket.date_start && (
                                <div className="flex items-center gap-1.5">
                                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                                  {format(new Date(ticket.date_start), "dd MMM yyyy", { locale: fr })}
                                </div>
                              )}
                              {ticket.city && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" /> {ticket.city}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              className="w-full gap-2 rounded-full"
                              onClick={() => handleDownload(ticket)}
                              disabled={ticketLoadingId === ticket.id}
                            >
                              {ticketLoadingId === ticket.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Download className="w-4 h-4" />}
                              {ticketLoadingId === ticket.id ? "Génération..." : "Télécharger le billet PDF"}
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-primary" /> Historique de participation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(pastTickets.length > 0 ? pastTickets : upcomingTickets).map((ticket) => {
              const sm = REGISTRATION_STATUS[ticket.status] || { label: ticket.status };
              const colorClass = statusColors[ticket.status] || "bg-muted text-muted-foreground";
              return (
                <motion.div key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-border/50 hover:shadow-md transition-shadow overflow-hidden">
                    {ticket.event_image && (
                      <div className="h-28 overflow-hidden bg-muted">
                        <img src={ticket.event_image} alt={ticket.event_title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-base leading-snug">{ticket.event_title || "Événement"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Réf. {ticket.id?.slice(-8)?.toUpperCase()}
                          </p>
                        </div>
                        <Badge className={`${colorClass} text-xs shrink-0`}>{sm.label}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {ticket.date_start && (
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                            {format(new Date(ticket.date_start), "dd MMM yyyy", { locale: fr })}
                          </div>
                        )}
                        {ticket.city && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" /> {ticket.city}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 col-span-2">
                          <span className="font-medium text-foreground">
                            {ticket.first_name} {ticket.last_name}
                          </span>
                        </div>
                      </div>

                      {ticket.status === "validee" && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          Billet validé — présentez le QR code à l'entrée
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="w-full gap-2 rounded-full"
                        onClick={() => handleDownload(ticket)}
                        disabled={ticketLoadingId === ticket.id}
                      >
                        {ticketLoadingId === ticket.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Download className="w-4 h-4" />}
                        {ticketLoadingId === ticket.id ? "Génération..." : "Télécharger le billet PDF"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
