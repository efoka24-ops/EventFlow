import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAdminAccounts, createAdminAccount, updateAdminAccount, deleteAdminAccount,
} from "@/api/adminApi";
import { tokenStore, decodeJwtPayload } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  KeyRound, Shield, ShieldCheck, HeadphonesIcon, DollarSign, Megaphone, Eye,
  UserPlus, MoreHorizontal, Trash2, ShieldOff, RefreshCw, AlertCircle, CheckCircle2,
  PenLine,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ── Role definitions ────────────────────────────────────────────────────────

const ROLE_META = {
  super_admin: {
    label: "Super Admin", icon: ShieldCheck, color: "bg-red-100 text-red-700",
    description: "Accès total à toutes les fonctionnalités. Propriétaire de la plateforme.",
    permissions: [
      "Tout gérer — événements, utilisateurs, paiements",
      "Configurer la plateforme",
      "Gérer les rôles et permissions",
      "Voir les logs système",
      "Accès aux paramètres techniques",
    ],
  },
  admin: {
    label: "Admin", icon: Shield, color: "bg-orange-100 text-orange-700",
    description: "Accès large mais sans configuration système ni gestion des rôles.",
    permissions: [
      "Gérer événements et inscriptions",
      "Voir et gérer les paiements",
      "Gérer les organisateurs",
      "Modérer les signalements",
      "Accès analytics",
    ],
  },
  support: {
    label: "Support", icon: HeadphonesIcon, color: "bg-blue-100 text-blue-700",
    description: "Équipe support client. Accès lecture + résolution signalements.",
    permissions: [
      "Voir les inscriptions et participants",
      "Voir les paiements (lecture seule)",
      "Traiter les signalements",
      "Gérer les articles d'aide",
      "Voir le dashboard",
    ],
  },
  finance: {
    label: "Finance", icon: DollarSign, color: "bg-emerald-100 text-emerald-700",
    description: "Équipe financière. Accès paiements, revenus et commissions.",
    permissions: [
      "Voir tous les paiements",
      "Accès revenus et commissions",
      "Export des données financières",
      "Gérer les remboursements",
    ],
  },
  marketing: {
    label: "Marketing", icon: Megaphone, color: "bg-violet-100 text-violet-700",
    description: "Équipe marketing. Accès campagnes, codes promo et CMS.",
    permissions: [
      "Gérer les codes promo",
      "Configurer la bannière",
      "Gérer le CMS",
      "Voir analytics",
      "Gérer les événements sponsorisés",
    ],
  },
  moderator: {
    label: "Modérateur", icon: Eye, color: "bg-slate-100 text-slate-700",
    description: "Modération de contenu. Traiter les signalements et approuver événements.",
    permissions: [
      "Approuver / rejeter événements",
      "Traiter les signalements",
      "Suspendre des organisateurs",
      "Accès lecture dashboard",
    ],
  },
};

const ASSIGNABLE_ROLES = ["admin", "support", "finance", "marketing", "moderator"];

const fmtDate = (d) => d ? format(new Date(d), "d MMM yyyy", { locale: fr }) : "—";
const fmtDateTime = (d) => d ? format(new Date(d), "d MMM yyyy HH:mm", { locale: fr }) : "Jamais";

function RoleBadge({ role }) {
  const meta = ROLE_META[role];
  if (!meta) return <Badge variant="outline" className="text-xs">{role}</Badge>;
  return (
    <Badge className={`${meta.color} border-0 text-xs gap-1`}>
      <meta.icon className="w-3 h-3" />{meta.label}
    </Badge>
  );
}

const EMPTY_FORM = { full_name: "", email: "", password: "", role: "admin" };

export default function AdminRoles() {
  const qc = useQueryClient();

  // Current logged-in admin from JWT
  const currentPayload = decodeJwtPayload(tokenStore.getAdminToken());
  const currentRole = currentPayload?.role || "admin";
  const currentId = currentPayload?.sub;
  const isSuperAdmin = currentRole === "super_admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editDialog, setEditDialog] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(null);

  const { data: accounts = [], isLoading, isError } = useQuery({
    queryKey: ["admin-role-accounts"],
    queryFn: listAdminAccounts,
    enabled: isSuperAdmin,
    staleTime: 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-role-accounts"] });

  const createMut = useMutation({
    mutationFn: createAdminAccount,
    onSuccess: () => { toast.success("Compte admin créé"); setCreateOpen(false); setForm(EMPTY_FORM); invalidate(); },
    onError: (e) => toast.error(e?.body?.error || "Erreur lors de la création"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateAdminAccount(id, data),
    onSuccess: () => { toast.success("Compte mis à jour"); setEditDialog(null); invalidate(); },
    onError: (e) => toast.error(e?.body?.error || "Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAdminAccount,
    onSuccess: () => { toast.success("Compte supprimé"); setDeleteDialog(null); invalidate(); },
    onError: (e) => toast.error(e?.body?.error || "Erreur lors de la suppression"),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return toast.error("Nom requis");
    if (!form.email.trim()) return toast.error("Email requis");
    if (!form.password || form.password.length < 6) return toast.error("Mot de passe minimum 6 caractères");
    createMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rôles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Définition des rôles d'accès à l'administration EventFlow</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
            <UserPlus className="w-4 h-4" />
            Ajouter un administrateur
          </Button>
        )}
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(ROLE_META).map(([key, role]) => {
          const Icon = role.icon;
          const isCurrent = key === currentRole;
          return (
            <Card key={key} className={`relative ${isCurrent ? "ring-2 ring-primary" : ""}`}>
              {isCurrent && (
                <div className="absolute top-3 right-3">
                  <Badge className="bg-primary text-primary-foreground text-xs">Votre rôle</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${role.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base">{role.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Permissions</p>
                  <ul className="space-y-1">
                    {role.permissions.map((perm) => (
                      <li key={perm} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {perm}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin accounts list */}
      {isSuperAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Comptes administrateurs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-10 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">Impossible de charger les comptes</p>
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground">Aucun compte trouvé</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Administrateur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière connexion</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((acc) => {
                      const isSelf = acc.id === currentId;
                      const isSA = acc.role === "super_admin";
                      return (
                        <TableRow key={acc.id} className={!acc.is_active || acc.is_suspended ? "opacity-60" : ""}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{acc.full_name}</p>
                              <p className="text-xs text-muted-foreground">{acc.email}</p>
                            </div>
                          </TableCell>
                          <TableCell><RoleBadge role={acc.role} /></TableCell>
                          <TableCell>
                            {acc.is_suspended ? (
                              <Badge className="bg-red-100 text-red-700 border-0 text-xs">Suspendu</Badge>
                            ) : acc.is_active ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Actif</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Inactif</Badge>
                            )}
                            {isSelf && <Badge variant="outline" className="text-xs ml-1">Vous</Badge>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDateTime(acc.last_login_at)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(acc.created_date)}</TableCell>
                          <TableCell>
                            {!isSelf && !isSA && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-8 h-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2"
                                    onClick={() => { setEditDialog(acc); setEditRole(acc.role); }}>
                                    <PenLine className="w-3.5 h-3.5" />Changer le rôle
                                  </DropdownMenuItem>
                                  {acc.is_suspended ? (
                                    <DropdownMenuItem className="gap-2"
                                      onClick={() => updateMut.mutate({ id: acc.id, data: { is_suspended: false, suspended_reason: "" } })}>
                                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />Réactiver
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem className="gap-2 text-amber-700"
                                      onClick={() => updateMut.mutate({ id: acc.id, data: { is_suspended: true } })}>
                                      <ShieldOff className="w-3.5 h-3.5" />Suspendre
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 text-red-600"
                                    onClick={() => setDeleteDialog(acc)}>
                                    <Trash2 className="w-3.5 h-3.5" />Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
      )}

      {/* Non-super-admin notice */}
      {!isSuperAdmin && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <KeyRound className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Gestion des rôles réservée au Super Admin</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Seul le Super Admin peut créer, modifier ou supprimer des comptes administrateurs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Create admin dialog ── */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(EMPTY_FORM); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel administrateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1">
              <Label>Nom complet *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Prénom Nom" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@exemple.com" />
            </div>
            <div className="space-y-1">
              <Label>Mot de passe *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 caractères" />
            </div>
            <div className="space-y-1">
              <Label>Rôle *</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* ── Edit role dialog ── */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Changer le rôle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Compte : <span className="font-medium text-foreground">{editDialog?.full_name}</span>
            </p>
            <Select value={editRole} onValueChange={setEditRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Annuler</Button>
            <Button
              onClick={() => updateMut.mutate({ id: editDialog.id, data: { role: editRole } })}
              disabled={updateMut.isPending || editRole === editDialog?.role}
            >
              Enregistrer
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
          <p className="text-sm text-muted-foreground">
            Le compte <span className="font-medium">{deleteDialog?.email}</span> sera définitivement supprimé.
            Cette action est irréversible.
          </p>
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
