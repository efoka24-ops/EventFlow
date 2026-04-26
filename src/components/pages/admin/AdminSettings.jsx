import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateSetting } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Save, Globe, CreditCard, CalendarDays, Bell, Megaphone, Store } from "lucide-react";

const CATEGORY_META = {
  general: { label: "Général", icon: Globe, color: "bg-blue-100 text-blue-700" },
  finance: { label: "Finance & Commissions", icon: CreditCard, color: "bg-amber-100 text-amber-700" },
  events: { label: "Événements", icon: CalendarDays, color: "bg-emerald-100 text-emerald-700" },
  notifications: { label: "Notifications", icon: Bell, color: "bg-violet-100 text-violet-700" },
  marketing: { label: "Marketing", icon: Megaphone, color: "bg-rose-100 text-rose-700" },
  marketplace: { label: "Marketplace", icon: Store, color: "bg-sky-100 text-sky-700" },
  technical: { label: "Technique", icon: Settings, color: "bg-slate-100 text-slate-700" },
  cms: { label: "CMS / Contenu", icon: Globe, color: "bg-purple-100 text-purple-700" },
};

function SettingField({ setting, onSave, isSaving }) {
  const [value, setValue] = useState(setting.value || "");
  const dirty = value !== (setting.value || "");

  const handleSave = () => onSave(setting.key, value);

  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Label className="text-sm font-medium">{setting.label}</Label>
          <Badge variant="outline" className="text-xs font-mono">{setting.key}</Badge>
        </div>
        {setting.description && (
          <p className="text-xs text-muted-foreground mb-2">{setting.description}</p>
        )}
        {setting.type === "boolean" ? (
          <Switch
            checked={value === "true"}
            onCheckedChange={(v) => { const s = v ? "true" : "false"; setValue(s); onSave(setting.key, s); }}
          />
        ) : setting.type === "textarea" ? (
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} className="text-sm" />
        ) : (
          <Input
            type={setting.type === "number" ? "number" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 text-sm max-w-xs"
          />
        )}
      </div>
      {setting.type !== "boolean" && dirty && (
        <Button size="sm" className="gap-1.5 shrink-0 mt-6" onClick={handleSave} disabled={isSaving}>
          <Save className="w-3.5 h-3.5" />Sauver
        </Button>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("general");

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });

  const updateMut = useMutation({
    mutationFn: ({ key, value }) => updateSetting(key, value),
    onSuccess: () => { toast.success("Paramètre mis à jour"); qc.invalidateQueries({ queryKey: ["admin-settings"] }); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const grouped = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres plateforme</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configuration globale d'EventFlow</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar catégories */}
        <div className="w-48 shrink-0 space-y-1">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] || { label: cat, icon: Settings, color: "bg-muted text-muted-foreground" };
            const Icon = meta.icon;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{meta.label || cat}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {(() => {
                const meta = CATEGORY_META[activeCategory];
                const Icon = meta?.icon || Settings;
                return <><Icon className="w-4 h-4" />{meta?.label || activeCategory}</>;
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Chargement...</div>
            ) : (grouped[activeCategory] || []).length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Aucun paramètre dans cette catégorie</p>
            ) : (
              <div className="divide-y">
                {(grouped[activeCategory] || []).map((s) => (
                  <SettingField
                    key={s.key}
                    setting={s}
                    onSave={(key, value) => updateMut.mutate({ key, value })}
                    isSaving={updateMut.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
