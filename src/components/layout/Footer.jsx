import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">EventFlow</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Plateforme de gestion d'evenements avec inscription, suivi des participants et pilotage admin.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Navigation</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
              <Link to="/events" className="hover:text-primary transition-colors">Evenements</Link>
              {/* <Link to="/admin/login" className="hover:text-primary transition-colors">Connexion admin</Link> */}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> contact@eventflow.local</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Garoua, Cameroun</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/60 text-sm text-muted-foreground flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EventFlow. Tous droits reserves.</p>
          <p>Suivi des inscriptions, exports CSV/Excel et geolocalisation admin.</p>
        </div>
      </div>
    </footer>
  );
}