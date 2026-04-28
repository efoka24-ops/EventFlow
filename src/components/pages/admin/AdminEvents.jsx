import { useState } from "react";
import { listEvents, deleteEvent } from "@/api/eventsApi";
import { approveEvent, toggleEventFeatured } from "@/api/adminApi";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, CheckCircle2, XCircle, Star, Search, Filter, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCategoryLabel, STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import EventFormDialog from "@/components/admin/EventFormDialog";
import EventFormFieldsDialog from "@/components/admin/EventFormFieldsDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_COLORS = {
  brouillon: "bg-muted text-muted-foreground",
  publie: "bg-emerald-100 text-emerald-800",
  annule: "bg-red-100 text-red-800",
  termine: "bg-slate-200 text-slate-700",
};

const APPROVAL_COLORS = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");

export default function AdminEvents() {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [fieldsEvent, setFieldsEvent] = useState(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => listEvents({ sort: "-created_date" }),
    refetchOnMount: "always",
  });

  const handleDelete = async () => {
    const id = deleteId;
    await deleteEvent(id);
    qc.setQueryData(["admin-events"], (prev = []) => prev.filter((e) => e.id !== id));
    qc.invalidateQueries({ queryKey: ["admin-events"] });
    qc.invalidateQueries({ queryKey: ["events"] });
    toast.success("Événement supprimé");
    setDeleteId(null);
  };

  const approveMut = useMutation({
    mutationFn: ({ id, status }) => approveEvent(id, status),
    onSuccess: (data) => {
      toast.success(data.approval_status === "approved" ? "Événement approuvé et publié" : "Événement rejeté");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const featuredMut = useMutation({
    mutationFn: (id) => toggleEventFeatured(id),
    onSuccess: (data) => {
      toast.success(data.is_featured ? "Mis en avant" : "Retiré de la une");
      qc.invalidateQueries({ queryKey: ["admin-events"] });
    },
    onError: () => toast.error("Erreur"),
  });

  const pending = events.filter((e) => e.approval_status === "pending");
  const featured = events.filter((e) => e.is_featured);

  const filtered = events
    .filter((e) => {
      if (tab === "pending") return e.approval_status === "pending";
      if (tab === "featured") return e.is_featured;
      return true;
    })
    .filter((e) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        e.title?.toLowerCase().includes(s) ||
        e.organizer_name?.toLowerCase().includes(s) ||
        e.organizer_email?.toLowerCase().includes(s) ||
        e.city?.toLowerCase().includes(s)
      );
    });

  const TABS = [
    { key: "all", label: "Tous", count: events.length },
    { key: "pending", label: "À approuver", count: pending.length, badge: "amber" },
    { key: "featured", label: "Mis en avant", count: featured.length },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Événements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{fmt(events.length)} événements · {fmt(pending.length)} en attente d'approbation</p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" />Nouvel événement
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                t.badge === "amber" && t.count > 0 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto pb-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-8 pl-8 w-52"
            />
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Organisateur</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Approbation</TableHead>
                <TableHead className="text-center">En avant</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Chargement...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Aucun événement</TableCell></TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id} className={`hover:bg-muted/30 ${e.approval_status === "pending" ? "bg-amber-50/50" : ""}`}>
                    <TableCell className="font-medium max-w-[180px]">
                      <p className="truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{getCategoryLabel(e.category)}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      <p>{e.organizer_name || "—"}</p>
                      {e.organizer_email && <p className="text-muted-foreground truncate max-w-[140px]">{e.organizer_email}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{e.city || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {e.date_start && format(new Date(e.date_start), "d MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_COLORS[e.status] || "bg-muted"} border-0 text-xs`}>
                        {STATUS_LABELS[e.status] || e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.approval_status === "pending" ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => approveMut.mutate({ id: e.id, status: "approved" })}
                            disabled={approveMut.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3" />Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-red-600 hover:bg-red-50"
                            onClick={() => approveMut.mutate({ id: e.id, status: "rejected" })}
                            disabled={approveMut.isPending}
                          >
                            <XCircle className="w-3 h-3" />Rejeter
                          </Button>
                        </div>
                      ) : (
                        <Badge className={`${APPROVAL_COLORS[e.approval_status] || "bg-muted"} border-0 text-xs`}>
                          {e.approval_status === "approved" ? "Approuvé" : e.approval_status === "rejected" ? "Rejeté" : e.approval_status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!!e.is_featured}
                        onCheckedChange={() => featuredMut.mutate(e.id)}
                        disabled={featuredMut.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-8 h-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link to={`/events/${e.id}`}><DropdownMenuItem className="gap-2"><Eye className="w-3.5 h-3.5" />Voir</DropdownMenuItem></Link>
                          <DropdownMenuItem className="gap-2" onClick={() => { setEditingEvent(e); setShowForm(true); }}>
                            <Pencil className="w-3.5 h-3.5" />Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => setFieldsEvent(e)}>
                            <ListChecks className="w-3.5 h-3.5" />Champs du formulaire
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => setDeleteId(e.id)}>
                            <Trash2 className="w-3.5 h-3.5" />Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showForm && (
        <EventFormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
          event={editingEvent}
        />
      )}

      {fieldsEvent && (
        <EventFormFieldsDialog
          open={!!fieldsEvent}
          onClose={() => setFieldsEvent(null)}
          event={fieldsEvent}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
