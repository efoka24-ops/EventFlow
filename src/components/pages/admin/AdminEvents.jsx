import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getCategoryLabel, STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import EventFormDialog from "@/components/admin/EventFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminEvents() {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => base44.entities.Event.list("-created_date"),
  });

  const handleDelete = async () => {
    await base44.entities.Event.delete(deleteId);
    queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    toast.success("Événement supprimé");
    setDeleteId(null);
  };

  const statusColors = {
    brouillon: "bg-muted text-muted-foreground",
    publie: "bg-emerald-100 text-emerald-800",
    annule: "bg-red-100 text-red-800",
    termine: "bg-slate-200 text-slate-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Gestion des événements</h1>
        <Button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Nouveau
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Aucun événement
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{event.title}</TableCell>
                    <TableCell className="text-sm">{getCategoryLabel(event.category)}</TableCell>
                    <TableCell className="text-sm">{event.city}</TableCell>
                    <TableCell className="text-sm">
                      {event.date_start && format(new Date(event.date_start), "d MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[event.status] || "bg-muted"}>
                        {STATUS_LABELS[event.status] || event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link to={`/events/${event.id}`}>
                            <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Voir</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => { setEditingEvent(event); setShowForm(true); }}>
                            <Pencil className="w-4 h-4 mr-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(event.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'événement sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}