import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPromoCodes, createPromoCode, togglePromoCode, deletePromoCode, fetchSettings, updateSetting } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, Tag, Percent, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fmtDate = (d) => d ? format(new Date(d), "d MMM yyyy", { locale: fr }) : "—";

function PromoCodeForm({ onSave, onCancel, isLoading }) {
  const [form, setForm] = useState({ code: "", discount_type: "percentage", discount_value: "", max_uses: "", valid_until: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Code promo *</Label>
          <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="EX: PROMO20" className="mt-1 font-mono" />
        </div>
        <div>
          <Label className="text-xs">Type de réduction *</Label>
          <Select value={form.discount_type} onValueChange={(v) => set("discount_type", v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Pourcentage (%)</SelectItem>
              <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Valeur de réduction *</Label>
          <Input type="number" value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} placeholder={form.discount_type === "percentage" ? "20" : "1000"} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Nombre max d'utilisations</Label>
          <Input type="number" value={form.max_uses} onChange={(e) => set("max_uses", e.target.value)} placeholder="Illimité" className="mt-1" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Date d'expiration</Label>
        <Input type="date" value={form.valid_until} onChange={(e) => set("valid_until", e.target.value)} className="mt-1" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button
          onClick={() => onSave({
            code: form.code,
            discount_type: form.discount_type,
            discount_value: parseFloat(form.discount_value),
            max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
            valid_until: form.valid_until || undefined,
          })}
          disabled={isLoading || !form.code || !form.discount_value}
        >
          Créer le code promo
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminMarketing() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: listPromoCodes,
  });

  const { data: settings = [] } = useQuery({
    queryKey: ["admin-settings", "marketing"],
    queryFn: () => fetchSettings("marketing"),
    staleTime: 60_000,
  });

  const bannerSetting = settings.find((s) => s.key === "promo_banner_active");
  const bannerText = settings.find((s) => s.key === "promo_banner_text");
  const [bannerTextValue, setBannerTextValue] = useState("");

  useEffect(() => {
    setBannerTextValue(bannerText?.value || "");
  }, [bannerText?.value]);

  const updateMut = useMutation({
    mutationFn: ({ key, value }) => updateSetting(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-settings"] }),
    onError: () => toast.error("Erreur"),
  });

  const createMut = useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => { toast.success("Code promo créé"); setCreateOpen(false); qc.invalidateQueries({ queryKey: ["admin-promo-codes"] }); },
    onError: (e) => toast.error(e.body?.error || "Erreur lors de la création"),
  });

  const toggleMut = useMutation({
    mutationFn: togglePromoCode,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promo-codes"] }),
    onError: () => toast.error("Erreur"),
  });

  const deleteMut = useMutation({
    mutationFn: deletePromoCode,
    onSuccess: () => { toast.success("Code supprimé"); qc.invalidateQueries({ queryKey: ["admin-promo-codes"] }); },
    onError: () => toast.error("Erreur"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing & Croissance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Bannières promotionnelles, codes promo et campagnes</p>
      </div>

      {/* Bannière promo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-rose-500" />Bannière promotionnelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={bannerSetting?.value === "true"}
              onCheckedChange={(v) => updateMut.mutate({ key: "promo_banner_active", value: v ? "true" : "false" })}
            />
            <Label>Activer la bannière en haut du site</Label>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Texte de la bannière</Label>
            <div className="flex gap-2">
              <Input
                value={bannerTextValue}
                onChange={(e) => setBannerTextValue(e.target.value)}
                placeholder="Ex: 🎉 Profitez de -20% sur tous les événements ce weekend !"
              />
              <Button size="sm" onClick={() => updateMut.mutate({ key: "promo_banner_text", value: bannerTextValue })}>
                Sauver
              </Button>
            </div>
          </div>
          {bannerSetting?.value === "true" && bannerText?.value && (
            <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              Aperçu : {bannerText.value}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Codes promo */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-500" />Codes promotionnels
          </CardTitle>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-3.5 h-3.5" />Nouveau code
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Chargement...</div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Aucun code promo</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Réduction</TableHead>
                    <TableHead className="text-center">Utilisations</TableHead>
                    <TableHead>Expire le</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono font-bold text-sm">{p.code}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          {p.discount_type === "percentage" ? <Percent className="w-3.5 h-3.5 text-muted-foreground" /> : <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />}
                          {p.discount_value}{p.discount_type === "percentage" ? "%" : " FCFA"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {p.uses_count}{p.max_uses ? `/${p.max_uses}` : ""}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(p.valid_until)}</TableCell>
                      <TableCell>
                        <Badge className={p.is_active ? "bg-emerald-100 text-emerald-700 border-0" : "bg-muted text-muted-foreground border-0"}>
                          {p.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => toggleMut.mutate(p.id)}>
                            {p.is_active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="w-7 h-7 text-red-500 hover:text-red-700" onClick={() => deleteMut.mutate(p.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau code promotionnel</DialogTitle></DialogHeader>
          <PromoCodeForm
            onSave={(data) => createMut.mutate(data)}
            onCancel={() => setCreateOpen(false)}
            isLoading={createMut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
