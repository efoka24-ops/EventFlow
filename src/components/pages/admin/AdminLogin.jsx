import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";

const isAdminUser = (user) => {
  if (!user) return false;
  return Boolean(
    user.isAdmin ||
    user.is_admin ||
    user.role === "admin" ||
    (Array.isArray(user.roles) && user.roles.includes("admin"))
  );
};

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loginAsAdmin } = useAuth();

  if (isAdminUser(user)) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const ok = await loginAsAdmin(password);
    setLoading(false);

    if (!ok) {
      toast.error("Mot de passe admin invalide");
      return;
    }

    toast.success("Connexion admin réussie");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" /> Connexion Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Mot de passe</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez le mot de passe admin"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Se connecter
            </Button>
            <p className="text-xs text-muted-foreground">
              Mot de passe par défaut: <strong>admin123</strong>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
