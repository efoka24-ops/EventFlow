import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listReports, resolveReport } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fmtDate = (d) => d ? format(new Date(d), "d MMM yyyy HH:mm", { locale: fr }) : "—";
const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");

const STATUS_META = {
  open: { label: "Ouvert", color: "bg-red-100 text-red-700" },
  reviewing: { label: "En cours", color: "bg-amber-100 text-amber-700" },
  resolved: { label: "Résolu", color: "bg-emerald-100 text-emerald-700" },
  dismissed: { label: "Rejeté", color: "bg-muted text-muted-foreground" },
};

const TYPE_META = {
  event: { label: "Événement", color: "bg-blue-100 text-blue-700" },
  user: { label: "Utilisateur", color: "bg-violet-100 text-violet-700" },
  content: { label: "Contenu", color: "bg-orange-100 text-orange-700" },
};

function ResolveDialog({ report, open, onClose }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("resolved");
  const [note, setNote] = useState("");

  const resolveMut = useMutation({
    mutationFn: (data) => resolveReport(report.id, data),
    onSuccess: () => { toast.success("Signalement traité"); qc.invalidateQueries({ queryKey: ["admin-reports"] }); onClose(); },
    onError: () => toast.error("Erreur"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Traiter le signalement</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Raison signalée</p>
            <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">{report?.reason}</p>
          </div>
          {report?.details && (
            <div>
              <p className="text-sm font-medium mb-1">Détails</p>
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">{report.details}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium mb-1">Décision</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="resolved">Résoudre — action prise</SelectItem>
                <SelectItem value="dismissed">Rejeter — non pertinent</SelectItem>
                <SelectItem value="reviewing">Mettre en révision</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Note de résolution</p>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Expliquer la décision prise..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => resolveMut.mutate({ status, resolution_note: note })} disabled={resolveMut.isPending}>
            Valider la décision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminSecurity() {
  const [statusFilter, setStatusFilter] = useState("open");
  const [resolveTarget, setResolveTarget] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: () => listReports(statusFilter === "all" ? undefined : statusFilter),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const openCount = reports.filter((r) => r.status === "open").length;
  const reviewingCount = reports.filter((r) => r.status === "reviewing").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sécurité & Modération</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion des signalements et modération de la plateforme</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Signalements ouverts", value: fmt(openCount), icon: AlertTriangle, color: "bg-red-100 text-red-700" },
          { label: "En cours de révision", value: fmt(reviewingCount), icon: Clock, color: "bg-amber-100 text-amber-700" },
          { label: "Résolus", value: fmt(resolvedCount), icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
          { label: "Total signalements", value: fmt(reports.length), icon: ShieldAlert, color: "bg-blue-100 text-blue-700" },
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-base">Signalements</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="open">Ouverts</SelectItem>
                <SelectItem value="reviewing">En révision</SelectItem>
                <SelectItem value="resolved">Résolus</SelectItem>
                <SelectItem value="dismissed">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Chargement...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Aucun signalement {statusFilter !== "all" ? `"${statusFilter}"` : ""}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Signalé par</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => {
                    const typeMeta = TYPE_META[r.reported_type] || { label: r.reported_type, color: "bg-muted" };
                    const statusMeta = STATUS_META[r.status] || { label: r.status, color: "bg-muted" };
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge className={`${typeMeta.color} border-0 text-xs`}>{typeMeta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <p>{r.reporter_name || "Anonyme"}</p>
                          {r.reporter_email && <p className="text-xs text-muted-foreground">{r.reporter_email}</p>}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{r.reason}</TableCell>
                        <TableCell>
                          <Badge className={`${statusMeta.color} border-0 text-xs`}>{statusMeta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(r.created_date)}</TableCell>
                        <TableCell>
                          {r.status === "open" || r.status === "reviewing" ? (
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => setResolveTarget(r)}>
                              <Eye className="w-3 h-3" />Traiter
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">{r.resolution_note ? "Note: " + r.resolution_note.slice(0, 30) + "..." : "—"}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ResolveDialog
        report={resolveTarget}
        open={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
      />
    </div>
  );
}
