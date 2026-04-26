import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listParticipants, getParticipantHistory } from "@/api/adminApi";
import { listRegistrations } from "@/api/registrationsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Users, Eye, Mail, Phone, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");
const fmtDate = (d) => d ? format(new Date(d), "d MMM yyyy", { locale: fr }) : "—";

function StatusBadge({ status }) {
  if (status === "validee") return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Validée</Badge>;
  if (status === "en_attente") return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">En attente</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Annulée</Badge>;
}

function ParticipantHistoryDialog({ participant, open, onClose }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["participant-history", participant?.email || participant?.phone],
    queryFn: () => getParticipantHistory(participant?.email || participant?.phone),
    enabled: open && !!participant,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historique — {participant?.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
          {participant?.email && <p className="flex items-center gap-2"><Mail className="w-4 h-4" />{participant.email}</p>}
          {participant?.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4" />{participant.phone}</p>}
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Chargement...</div>
        ) : history.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">Aucun historique</p>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{r.event_title || "Événement inconnu"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.city && `${r.city} · `}{r.category && `${r.category} · `}{fmtDate(r.date_start)}
                    </p>
                    <p className="text-xs text-muted-foreground">Inscrit le {fmtDate(r.created_date)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminParticipants() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-participants", debouncedSearch],
    queryFn: () => listParticipants({ search: debouncedSearch, limit: 100 }),
    staleTime: 30_000,
  });

  const participants = data?.participants || [];
  const total = data?.total || 0;

  const openHistory = (p) => { setSelected(p); setHistoryOpen(true); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion de tous les participants inscrits sur la plateforme</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Participants uniques", value: fmt(total), icon: Users, color: "bg-blue-100 text-blue-700" },
          { label: "Inscriptions totales", value: fmt(participants.reduce((s, p) => s + Number(p.total_registrations), 0)), icon: Calendar, color: "bg-emerald-100 text-emerald-700" },
          { label: "Confirmées", value: fmt(participants.reduce((s, p) => s + Number(p.confirmed), 0)), icon: CheckCircle2, color: "bg-violet-100 text-violet-700" },
          { label: "Annulées", value: fmt(participants.reduce((s, p) => s + Number(p.cancelled), 0)), icon: XCircle, color: "bg-red-100 text-red-700" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-base">Liste des participants</CardTitle>
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : participants.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">Aucun participant trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Inscriptions</TableHead>
                    <TableHead className="text-center">Confirmées</TableHead>
                    <TableHead className="text-center">Annulées</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead>Premier vu</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.identifier} className="hover:bg-muted/30">
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.email && <p>{p.email}</p>}
                        {p.phone && <p>{p.phone}</p>}
                      </TableCell>
                      <TableCell className="text-center font-semibold">{p.total_registrations}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-emerald-700 font-semibold">{p.confirmed}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-red-600 font-semibold">{p.cancelled}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(p.last_activity)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(p.first_seen)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openHistory(p)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ParticipantHistoryDialog
        participant={selected}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
