import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, updateSetting } from "@/api/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { FileText, Save, Eye, Globe, BookOpen, Info, Lock } from "lucide-react";

const CMS_FIELD_DEFAULTS = {
  homepage_hero_title: {
    key: "homepage_hero_title",
    label: "Titre hero homepage",
    description: "Titre principal de la page d'accueil",
    type: "text",
    value: "Découvrez les meilleurs événements",
  },
  homepage_hero_subtitle: {
    key: "homepage_hero_subtitle",
    label: "Sous-titre hero homepage",
    description: "Sous-titre de la page d'accueil",
    type: "text",
    value: "Trouvez et réservez vos événements préférés en quelques clics",
  },
  promo_banner_active: {
    key: "promo_banner_active",
    label: "Bannière promo active",
    description: "Afficher la bannière promotionnelle en haut du site",
    type: "boolean",
    value: "false",
  },
  promo_banner_text: {
    key: "promo_banner_text",
    label: "Texte bannière promo",
    description: "Texte de la bannière promotionnelle",
    type: "text",
    value: "",
  },
  platform_name: {
    key: "platform_name",
    label: "Nom de la plateforme",
    description: "Nom affiché sur le site",
    type: "text",
    value: "EventFlow",
  },
};

function SettingEditor({ setting, onSave, isSaving }) {
  const [value, setValue] = useState(setting?.value || "");
  const dirty = value !== (setting?.value || "");

  if (!setting) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{setting.label}</Label>
        <Badge variant="outline" className="text-xs font-mono">{setting.key}</Badge>
      </div>
      {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
      {setting.type === "boolean" ? (
        <div className="flex items-center gap-3 pt-1">
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) => {
              const nextValue = checked ? "true" : "false";
              setValue(nextValue);
              onSave(setting.key, nextValue);
            }}
            disabled={isSaving}
          />
          <span className="text-sm text-muted-foreground">
            {value === "true" ? "Activé" : "Désactivé"}
          </span>
        </div>
      ) : setting.type === "textarea" ? (
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4} />
      ) : (
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
      )}
      {setting.type !== "boolean" && dirty && (
        <Button size="sm" className="gap-1.5" onClick={() => onSave(setting.key, value)} disabled={isSaving}>
          <Save className="w-3.5 h-3.5" />Enregistrer
        </Button>
      )}
    </div>
  );
}

export default function AdminCMS() {
  const qc = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });

  const settingsMap = settings.reduce((acc, s) => { acc[s.key] = s; return acc; }, {});
  const resolveSetting = (key) => settingsMap[key] || CMS_FIELD_DEFAULTS[key] || null;

  const updateMut = useMutation({
    mutationFn: ({ key, value }) => updateSetting(key, value),
    onSuccess: () => { toast.success("Contenu mis à jour"); qc.invalidateQueries({ queryKey: ["admin-settings"] }); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const heroTitle = settingsMap["homepage_hero_title"]?.value || "";
  const heroSub = settingsMap["homepage_hero_subtitle"]?.value || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestion de Contenu (CMS)</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Modifiez le contenu du site sans intervention technique</p>
      </div>

      {/* Aperçu hero */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />Aperçu — Page d'accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{heroTitle || "Titre de la homepage"}</h2>
            <p className="text-muted-foreground">{heroSub || "Sous-titre de la homepage"}</p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Homepage content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4" />Page d'accueil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {["homepage_hero_title", "homepage_hero_subtitle"].map((key) => (
                <SettingEditor
                  key={key}
                  setting={resolveSetting(key)}
                  onSave={(k, v) => updateMut.mutate({ key: k, value: v })}
                  isSaving={updateMut.isPending}
                />
              ))}
            </CardContent>
          </Card>

          {/* Marketing content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4" />Bannière marketing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {["promo_banner_text", "promo_banner_active"].map((key) => (
                <SettingEditor
                  key={key}
                  setting={resolveSetting(key)}
                  onSave={(k, v) => updateMut.mutate({ key: k, value: v })}
                  isSaving={updateMut.isPending}
                />
              ))}
            </CardContent>
          </Card>

          {/* Pages légales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />Pages légales & FAQ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Conditions d'utilisation", path: "/legal/terms" },
                  { label: "Politique de confidentialité", path: "/legal/privacy" },
                  { label: "FAQ / Aide", path: "/help" },
                ].map((page) => (
                  <div key={page.path} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{page.label}</p>
                      <p className="text-xs text-muted-foreground font-mono">{page.path}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="w-3 h-3" />Lecture seule
                      </Badge>
                      <a href={page.path} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                          <Eye className="w-3 h-3" />Voir
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
                <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground space-y-2">
                  <p>Les pages légales affichées ici sont encore statiques et ne sont pas éditées depuis le CMS.</p>
                  <p>
                    Les articles d'aide sont gérés dans{" "}
                    <Link to="/admin/help" className="text-primary underline">Articles d'aide</Link>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform name & branding */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />Identité de la plateforme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SettingEditor
                setting={resolveSetting("platform_name")}
                onSave={(k, v) => updateMut.mutate({ key: k, value: v })}
                isSaving={updateMut.isPending}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
