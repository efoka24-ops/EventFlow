import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Search, Eye, CheckCircle2, XCircle, Clock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fetchAdminPayments = async () => {
  const res = await fetch("/api/payments");
  if (!res.ok) throw new Error("Erreur chargement paiements");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const STATUS_CONFIG = {
  successful: { label: "Réussi", variant: "default", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  pending: { label: "En attente", variant: "outline", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  initiated: { label: "Initié", variant: "outline", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Clock, note: "Demande envoyée — en attente de validation MoMo par le participant" },
  failed: { label: "Échoué", variant: "destructive", color: "text-red-600 bg-red-50 border-red-200", icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["pending"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

export default function AdminPayments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data: payments = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: fetchAdminPayments,
    refetchInterval: 15000,
    retry: 2,
  });

  const filtered = payments.filter((p) => {
    const matchStatus = statusFilter === "all" || p.status_local === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (p.phone_number || "").toLowerCase().includes(q) ||
      (p.campay_reference || "").toLowerCase().includes(q) ||
      (p.external_reference || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalAmount = filtered
    .filter((p) => p.status_local === "successful")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const countByStatus = (s) => payments.filter((p) => p.status_local === s).length;

  const fmt = (date) => {
    if (!date) return "—";
    try { return format(new Date(date), "dd MMM yyyy HH:mm", { locale: fr }); } catch { return "—"; }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Monitoring Paiements
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Suivi des transactions CamPay en temps réel</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total collecté</p>
            <p className="text-2xl font-bold text-emerald-600">{totalAmount.toLocaleString()} <span className="text-sm font-normal">FCFA</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Réussis</p>
            <p className="text-2xl font-bold">{countByStatus("successful")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-2xl font-bold text-amber-600">{countByStatus("pending") + countByStatus("initiated")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Échoués</p>
            <p className="text-2xl font-bold text-red-600">{countByStatus("failed")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher par téléphone, référence…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="successful">Réussis</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="initiated">Initiés</SelectItem>
            <SelectItem value="failed">Échoués</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Aucun paiement trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payeur</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Opérateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Référence CamPay</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmt(p.created_date)}
                    </TableCell>
                    <TableCell className="max-w-[140px]">
                      <p className="font-medium text-sm truncate">{p.payer_name || "—"}</p>
                      {p.geolocation?.city && (
                        <p className="text-xs text-muted-foreground truncate">{[p.geolocation.city, p.geolocation.country].filter(Boolean).join(", ")}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{p.phone_number || "—"}</TableCell>
                    <TableCell className="font-semibold">
                      {Number(p.amount || 0).toLocaleString()} {p.currency || "XAF"}
                    </TableCell>
                    <TableCell>
                      {p.operator ? (
                        <Badge variant="outline" className="text-xs">{p.operator}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <StatusBadge status={p.status_local} />
                        {p.status_local === "initiated" && (
                          <p className="text-xs text-blue-500 leading-tight">En attente de validation MoMo</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                      {p.campay_reference || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => setSelected(p)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail du paiement</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-muted-foreground">Statut</p><StatusBadge status={selected.status_local} /></div>
                <div><p className="text-xs text-muted-foreground">Montant</p><p className="font-bold">{Number(selected.amount).toLocaleString()} {selected.currency}</p></div>
                <div><p className="text-xs text-muted-foreground">Payeur</p><p className="font-medium">{selected.payer_name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Téléphone</p><p className="font-mono">{selected.phone_number || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Opérateur</p><p>{selected.operator || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Créé le</p><p>{fmt(selected.created_date)}</p></div>
                <div><p className="text-xs text-muted-foreground">Payé le</p><p>{fmt(selected.paid_at)}</p></div>
              </div>
              {selected.geolocation && (
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Géolocalisation</p>
                  <p className="text-sm">{[selected.geolocation.city, selected.geolocation.region, selected.geolocation.country].filter(Boolean).join(", ") || "—"}</p>
                  {selected.geolocation.latitude && (
                    <p className="text-xs font-mono text-muted-foreground">{selected.geolocation.latitude.toFixed(5)}, {selected.geolocation.longitude.toFixed(5)}</p>
                  )}
                </div>
              )}
              {selected.device_info && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Appareil</p>
                  <p className="text-xs break-all text-muted-foreground bg-muted p-2 rounded">{selected.device_info}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p>{selected.description || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Référence CamPay</p>
                <p className="font-mono text-xs break-all">{selected.campay_reference || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Référence interne</p>
                <p className="font-mono text-xs break-all">{selected.external_reference || selected.id || "—"}</p>
              </div>
              {selected.ussd_code && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Code USSD</p>
                  <p className="font-mono font-bold text-lg">{selected.ussd_code}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
