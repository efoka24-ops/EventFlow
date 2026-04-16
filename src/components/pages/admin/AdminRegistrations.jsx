import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, CheckCircle2, XCircle, Trash2, Eye, MapPin, Loader2, Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { REGISTRATION_STATUS } from "@/lib/constants";
import { toast } from "sonner";
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

export default function AdminRegistrations() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReg, setSelectedReg] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [validatingId, setValidatingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["admin-registrations"],
    queryFn: () => base44.entities.Registration.list("-created_date"),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => base44.entities.Event.list(),
  });

  const getEventTitle = (eventId) => {
    const event = events.find((e) => e.id === eventId);
    return event?.title || "Événement inconnu";
  };

  const getEvent = (eventId) => events.find((e) => e.id === eventId);

  const filtered = statusFilter === "all"
    ? registrations
    : registrations.filter((r) => r.status === statusFilter);

  const buildExportRows = () => filtered.map((reg) => ({
    participant: `${reg.first_name || ""} ${reg.last_name || ""}`.trim(),
    email: reg.email || "",
    telephone: reg.phone || "",
    fournisseur_email: reg.email_provider || "",
    compte_gmail: reg.has_gmail_account ? "Oui" : "Non",
    evenement: getEventTitle(reg.event_id),
    methode: reg.registration_method === "email_auto" ? "Rapide" : "Formulaire",
    statut: REGISTRATION_STATUS[reg.status]?.label || reg.status,
    date_inscription: reg.created_date
      ? format(new Date(reg.created_date), "dd/MM/yyyy HH:mm", { locale: fr })
      : "",
    latitude: reg.geo_latitude ?? "",
    longitude: reg.geo_longitude ?? "",
    precision_m: reg.geo_accuracy ?? "",
    localisation: reg.geo_location_label || "",
    ville: reg.geo_city || "",
    region: reg.geo_region || "",
    pays: reg.geo_country || "",
    genre: reg.gender || "",
    age: reg.age || "",
    piece_identite: reg.id_type || "",
    numero_piece: reg.id_number || "",
  }));

  const downloadBlob = (content, fileName, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.error("Aucune inscription à exporter");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(";"),
      ...rows.map((row) =>
        headers
          .map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`)
          .join(";")
      ),
    ].join("\n");

    downloadBlob(`\uFEFF${csv}`, `inscriptions-${Date.now()}.csv`, "text/csv;charset=utf-8;");
    toast.success("Export CSV généré");
  };

  const handleExportExcel = () => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.error("Aucune inscription à exporter");
      return;
    }

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Inscriptions");
    XLSX.writeFile(workbook, `inscriptions-${Date.now()}.xlsx`);
    toast.success("Export Excel généré");
  };

  const handleValidate = async (reg) => {
    setValidatingId(reg.id);
    await base44.entities.Registration.update(reg.id, { status: "validee" });

    if (reg.email) {
      const event = getEvent(reg.event_id);
      await base44.integrations.Core.SendEmail({
        to: reg.email,
        subject: `✅ Inscription validée - ${event?.title || "Événement"}`,
        body: `
          <h2>Bonjour ${reg.first_name} ${reg.last_name},</h2>
          <p>Votre inscription à l'événement <strong>${event?.title || ""}</strong> a été <strong>validée</strong> !</p>
          ${event ? `
          <h3>Informations de l'événement :</h3>
          <ul>
            <li><strong>Date :</strong> ${event.date_start ? format(new Date(event.date_start), "d MMMM yyyy à HH:mm", { locale: fr }) : "À confirmer"}</li>
            <li><strong>Lieu :</strong> ${event.location_name || event.city || "À confirmer"}</li>
            ${event.address ? `<li><strong>Adresse :</strong> ${event.address}</li>` : ""}
          </ul>` : ""}
          <p>À bientôt !</p>
          <p><em>L'équipe EventFlow</em></p>
        `,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
    toast.success("Inscription validée et email envoyé !");
    setValidatingId(null);
  };

  const handleRefuse = async (reg) => {
    await base44.entities.Registration.update(reg.id, { status: "refusee" });

    if (reg.email) {
      const event = getEvent(reg.event_id);
      await base44.integrations.Core.SendEmail({
        to: reg.email,
        subject: `Inscription refusée - ${event?.title || "Événement"}`,
        body: `
          <h2>Bonjour ${reg.first_name} ${reg.last_name},</h2>
          <p>Nous sommes désolés, votre inscription à l'événement <strong>${event?.title || ""}</strong> n'a pas pu être validée.</p>
          <p>N'hésitez pas à consulter d'autres événements disponibles sur notre plateforme.</p>
          <p><em>L'équipe EventFlow</em></p>
        `,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
    toast.success("Inscription refusée");
  };

  const handleDelete = async () => {
    await base44.entities.Registration.delete(deleteId);
    queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
    toast.success("Inscription supprimée");
    setDeleteId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Gestion des inscriptions</h1>
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <Button variant="outline" onClick={handleExportCsv} className="gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2 w-full sm:w-auto">
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="validee">Validées</SelectItem>
              <SelectItem value="refusee">Refusées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Événement</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Aucune inscription
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">{reg.first_name} {reg.last_name}</TableCell>
                    <TableCell className="text-sm">{reg.email || reg.phone || "-"}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{getEventTitle(reg.event_id)}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">
                        {reg.registration_method === "email_auto" ? "Rapide" : "Formulaire"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={REGISTRATION_STATUS[reg.status]?.color || "bg-muted"}>
                        {REGISTRATION_STATUS[reg.status]?.label || reg.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {reg.created_date && format(new Date(reg.created_date), "d MMM", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedReg(reg)}>
                            <Eye className="w-4 h-4 mr-2" /> Détails
                          </DropdownMenuItem>
                          {reg.status === "en_attente" && (
                            <>
                              <DropdownMenuItem onClick={() => handleValidate(reg)} disabled={validatingId === reg.id}>
                                {validatingId === reg.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                                )}
                                Valider
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRefuse(reg)}>
                                <XCircle className="w-4 h-4 mr-2 text-amber-600" /> Refuser
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(reg.id)}>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l'inscription</DialogTitle>
            <DialogDescription>
              Informations soumises par le participant pour cet événement.
            </DialogDescription>
          </DialogHeader>
          {selectedReg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Prénom</p>
                  <p className="font-medium">{selectedReg.first_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="font-medium">{selectedReg.last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{selectedReg.email || "-"}</p>
                    {selectedReg.has_gmail_account && (
                      <Badge variant="secondary">Gmail</Badge>
                    )}
                    {selectedReg.email_provider && !selectedReg.has_gmail_account && (
                      <Badge variant="outline">{selectedReg.email_provider}</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedReg.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Genre</p>
                  <p className="font-medium capitalize">{selectedReg.gender || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Âge</p>
                  <p className="font-medium">{selectedReg.age || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pièce d'identité</p>
                  <p className="font-medium">{selectedReg.id_type ? `${selectedReg.id_type} - ${selectedReg.id_number}` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Événement</p>
                  <p className="font-medium">{getEventTitle(selectedReg.event_id)}</p>
                </div>
              </div>
              {(selectedReg.geo_latitude && selectedReg.geo_longitude) && (
                <div className="space-y-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Géolocalisation</p>
                      <p className="text-sm font-medium">
                        {selectedReg.geo_latitude?.toFixed(6)}, {selectedReg.geo_longitude?.toFixed(6)}
                      </p>
                      {selectedReg.geo_accuracy && (
                        <p className="text-xs text-muted-foreground">
                          Précision estimée: ±{Math.round(selectedReg.geo_accuracy)} m
                        </p>
                      )}
                    </div>
                  </div>
                  {(selectedReg.geo_location_label || selectedReg.geo_city || selectedReg.geo_country) && (
                    <div className="pl-6">
                      <p className="text-xs text-muted-foreground">Localisation détectée</p>
                      <p className="text-sm font-medium">
                        {selectedReg.geo_location_label || [selectedReg.geo_city, selectedReg.geo_region, selectedReg.geo_country].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  )}
                  <div className="pl-6">
                    <a
                      href={`https://www.google.com/maps?q=${selectedReg.geo_latitude},${selectedReg.geo_longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Ouvrir dans Google Maps
                    </a>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                {selectedReg.status === "en_attente" && (
                  <>
                    <Button variant="outline" onClick={() => { handleRefuse(selectedReg); setSelectedReg(null); }}>
                      Refuser
                    </Button>
                    <Button onClick={() => { handleValidate(selectedReg); setSelectedReg(null); }}>
                      Valider l'inscription
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette inscription ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
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