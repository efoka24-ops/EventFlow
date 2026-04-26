import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOrganizers, createOrganizer, suspendOrganizer, unsuspendOrganizer,
  verifyOrganizer, deleteOrganizer,
} from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Search, UserCog, MoreHorizontal, Shield, ShieldOff, CheckCircle2, Trash2,
  TrendingUp, UserPlus, AlertCircle, CalendarDays, Users, Globe, BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");
const fmtXAF = (n) => `${fmt(Math.round(Number(n || 0)))} FCFA`;
const fmtDate = (d) => d ? format(new Date(d), "d MMM yyyy", { locale: fr }) : "—";
const fmtDateTime = (d) => d ? format(new Date(d), "d MMM yyyy à HH:mm", { locale: fr }) : "—";

function StatusBadge({ o }) {
  if (o.is_suspended) return <Badge className="bg-red-100 text-red-700 border-0 text-xs">Suspendu</Badge>;
  if (o.is_verified) return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Vérifié</Badge>;
  return <Badge variant="outline" className="text-xs">Actif</Badge>;
}

const EMPTY_FORM = { full_name: "", email: "", phone: "", password: "", organizer_bio: "", organizer_website: "", organizer_category: "" };
const CATEGORIES = ["Musique", "Sport", "Business", "Art & Culture", "Technologie", "Gastronomie", "Éducation", "Mode & Beauté", "Religion & Spiritualité", "Autre"];

export default function AdminOrganizers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [suspendDialog, setSuspendDialog] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detailOrg, setDetailOrg] = useState(null);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(window._orgSearchTimeout);
    window._orgSearchTimeout = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-organizers", debouncedSearch, statusFilter],
    queryFn: () => listOrganizers({
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
    }),
    staleTime: 30_000,
  });

  const organizers = data?.organizers || [];
  const total = data?.total ?? 0;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-organizers"] });

  const suspendMut = useMutation({
    mutationFn: ({ id, reason }) => suspendOrganizer(id, reason),
    onSuccess: () => { toast.success("Organisateur suspendu"); setSuspendDialog(null); setSuspendReason(""); invalidate(); },
    onError: () => toast.error("Erreur lors de la suspension"),
  });

  const unsuspendMut = useMutation({
    mutationFn: (id) => unsuspendOrganizer(id),
    onSuccess: () => { toast.success("Suspension levée"); invalidate(); },
    onError: () => toast.error("Erreur"),
  });

  const verifyMut = useMutation({
    mutationFn: (id) => verifyOrganizer(id),
    onSuccess: () => { toast.success("Organisateur vérifié"); invalidate(); },
    onError: () => toast.error("Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deleteOrganizer(id),
    onSuccess: () => { toast.success("Compte supprimé"); setDeleteDialog(null); setDetailOrg(null); invalidate(); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const createMut = useMutation({
    mutationFn: (data) => createOrganizer(data),
    onSuccess: () => { toast.success("Organisateur créé"); setCreateOpen(false); setForm(EMPTY_FORM); invalidate(); },
    onError: (e) => toast.error(e?.body?.error || "Erreur lors de la création"),
  });

  const stats = {
    verified: organizers.filter((o) => o.is_verified).length,
    suspended: organizers.filter((o) => o.is_suspended).length,
    revenue: organizers.reduce((s, o) => s + Number(o.total_revenue || 0), 0),
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return toast.error("Le nom est requis");
    if (!form.email.trim() && !form.phone.trim()) return toast.error("Email ou téléphone requis");
    if (!form.password || form.password.length < 6) return toast.error("Mot de passe minimum 6 caractères");
    createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organisateurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des comptes organisateurs et créateurs d'événements</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <UserPlus className="w-4 h-4" />
          Nouvel organisateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total organisateurs", value: fmt(total), icon: UserCog, color: "bg-blue-100 text-blue-700" },
          { label: "Vérifiés", value: fmt(stats.verified), icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700" },
          { label: "Suspendus", value: fmt(stats.suspended), icon: ShieldOff, color: "bg-red-100 text-red-700" },
          { label: "Revenus générés", value: fmtXAF(stats.revenue), icon: TrendingUp, color: "bg-amber-100 text-amber-700" },
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
            <CardTitle className="text-base">Liste des organisateurs</CardTitle>
            <div className="flex gap-2 flex-1 flex-wrap">
              <div className="relative max-w-xs flex-1">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Nom, email, téléphone..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="verified">Vérifiés</SelectItem>
                  <SelectItem value="suspended">Suspendus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-12 text-destructive">
              <AlertCircle className="w-6 h-6" />
              <p className="text-sm font-medium">Impossible de charger les organisateurs</p>
              <p className="text-xs text-muted-foreground">{error?.message || "Erreur serveur"}</p>
            </div>
          ) : organizers.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">Aucun organisateur trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisateur</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Événements</TableHead>
                    <TableHead className="text-center">Publiés</TableHead>
                    <TableHead className="text-center">Inscriptions</TableHead>
                    <TableHead>Revenus</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizers.map((o) => (
                    <TableRow
                      key={o.id}
                      className={`hover:bg-muted/30 cursor-pointer ${o.is_suspended ? "opacity-60" : ""}`}
                      onClick={() => setDetailOrg(o)}
                    >
                      <TableCell className="font-medium">{o.full_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {o.email && <p>{o.email}</p>}
                        {o.phone && <p>{o.phone}</p>}
                      </TableCell>
                      <TableCell className="text-center">{o.events_count || 0}</TableCell>
                      <TableCell className="text-center">{o.published_events || 0}</TableCell>
                      <TableCell className="text-center">{o.total_registrations || 0}</TableCell>
                      <TableCell className="text-sm font-semibold text-emerald-700">{fmtXAF(o.total_revenue)}</TableCell>
                      <TableCell><StatusBadge o={o} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(o.created_date)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!o.is_verified && (
                              <DropdownMenuItem onClick={() => verifyMut.mutate(o.id)} className="gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />Vérifier
                              </DropdownMenuItem>
                            )}
                            {o.is_suspended ? (
                              <DropdownMenuItem onClick={() => unsuspendMut.mutate(o.id)} className="gap-2">
                                <Shield className="w-3.5 h-3.5 text-emerald-600" />Lever la suspension
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => setSuspendDialog(o)} className="gap-2 text-amber-700">
                                <ShieldOff className="w-3.5 h-3.5" />Suspendre
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteDialog(o)} className="gap-2 text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />Supprimer le compte
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail sheet ── */}
      <Sheet open={!!detailOrg} onOpenChange={(o) => !o && setDetailOrg(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailOrg && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {detailOrg.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle className="text-base">{detailOrg.full_name}</SheetTitle>
                    <p className="text-xs text-muted-foreground">{detailOrg.email || detailOrg.phone}</p>
                  </div>
                  <div className="ml-auto"><StatusBadge o={detailOrg} /></div>
                </div>
              </SheetHeader>

              <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Événements", value: detailOrg.events_count || 0, icon: CalendarDays },
                    { label: "Inscriptions", value: detailOrg.total_registrations || 0, icon: Users },
                    { label: "Revenus", value: fmtXAF(detailOrg.total_revenue), icon: TrendingUp },
                  ].map((s) => (
                    <div key={s.label} className="bg-muted/40 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Contact & dates */}
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium text-xs uppercase text-muted-foreground tracking-wide">Informations</h4>
                  {detailOrg.email && <p><span className="text-muted-foreground w-28 inline-block">Email</span>{detailOrg.email}</p>}
                  {detailOrg.phone && <p><span className="text-muted-foreground w-28 inline-block">Téléphone</span>{detailOrg.phone}</p>}
                  <p><span className="text-muted-foreground w-28 inline-block">Inscription</span>{fmtDateTime(detailOrg.created_date)}</p>
                  {detailOrg.organizer_category && (
                    <p><span className="text-muted-foreground w-28 inline-block">Catégorie</span>{detailOrg.organizer_category}</p>
                  )}
                  {detailOrg.organizer_website && (
                    <p className="flex items-center gap-1">
                      <span className="text-muted-foreground w-28 inline-block">Site web</span>
                      <a href={detailOrg.organizer_website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                        <Globe className="w-3 h-3" />{detailOrg.organizer_website}
                      </a>
                    </p>
                  )}
                </div>

                {detailOrg.organizer_bio && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <h4 className="font-medium text-xs uppercase text-muted-foreground tracking-wide flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />Bio
                      </h4>
                      <p className="text-sm text-muted-foreground">{detailOrg.organizer_bio}</p>
                    </div>
                  </>
                )}

                {detailOrg.is_suspended && (
                  <>
                    <Separator />
                    <div className="space-y-1 rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                        <ShieldOff className="w-3.5 h-3.5" />Compte suspendu le {fmtDateTime(detailOrg.suspended_at)}
                      </p>
                      {detailOrg.suspended_reason && (
                        <p className="text-xs text-red-600">{detailOrg.suspended_reason}</p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!detailOrg.is_verified && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 border-emerald-200"
                      onClick={() => { verifyMut.mutate(detailOrg.id); setDetailOrg({ ...detailOrg, is_verified: true }); }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />Vérifier
                    </Button>
                  )}
                  {detailOrg.is_suspended ? (
                    <Button size="sm" variant="outline" className="gap-1.5"
                      onClick={() => { unsuspendMut.mutate(detailOrg.id); setDetailOrg({ ...detailOrg, is_suspended: false, suspended_at: null, suspended_reason: null }); }}>
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />Lever la suspension
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1.5 text-amber-700 border-amber-200"
                      onClick={() => { setSuspendDialog(detailOrg); setDetailOrg(null); }}>
                      <ShieldOff className="w-3.5 h-3.5" />Suspendre
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 ml-auto"
                    onClick={() => { setDeleteDialog(detailOrg); setDetailOrg(null); }}>
                    <Trash2 className="w-3.5 h-3.5" />Supprimer
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Create dialog ── */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(EMPTY_FORM); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel organisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label>Nom complet *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nom de l'organisateur" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
              </div>
              <div className="space-y-1">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+237 6XX XXX XXX" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Mot de passe *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 caractères" />
            </div>
            <div className="space-y-1">
              <Label>Catégorie</Label>
              <Select value={form.organizer_category} onValueChange={(v) => setForm({ ...form, organizer_category: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Site web</Label>
              <Input value={form.organizer_website} onChange={(e) => setForm({ ...form, organizer_website: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label>Bio</Label>
              <Textarea value={form.organizer_bio} onChange={(e) => setForm({ ...form, organizer_bio: e.target.value })} placeholder="Description de l'organisateur..." rows={3} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? "Création..." : "Créer le compte"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Suspend dialog ── */}
      <Dialog open={!!suspendDialog} onOpenChange={() => { setSuspendDialog(null); setSuspendReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre {suspendDialog?.full_name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action empêchera l'organisateur de se connecter et de gérer ses événements.</p>
          <Textarea
            placeholder="Raison de la suspension (optionnel)..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSuspendDialog(null); setSuspendReason(""); }}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => suspendMut.mutate({ id: suspendDialog.id, reason: suspendReason })}
              disabled={suspendMut.isPending}
            >
              Suspendre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer {deleteDialog?.full_name} ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. Tous les événements de cet organisateur seront dissociés du compte.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={() => deleteMut.mutate(deleteDialog.id)} disabled={deleteMut.isPending}>
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
