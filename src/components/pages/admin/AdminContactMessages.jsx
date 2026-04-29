import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Mail, Trash2, CheckCheck, Reply, Archive, ChevronDown, ChevronUp,
  Clock, User, MessageSquare, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const authHeader = () => {
  const token = localStorage.getItem("eventflow_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiFetch = (path, opts = {}) =>
  fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader(), ...(opts.headers || {}) },
    ...opts,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || r.statusText);
    return data;
  });

const STATUS_LABELS = {
  unread:   { label: "Non lu",   color: "bg-red-100 text-red-700 border-red-200" },
  read:     { label: "Lu",       color: "bg-blue-100 text-blue-700 border-blue-200" },
  replied:  { label: "Répondu",  color: "bg-green-100 text-green-700 border-green-200" },
  archived: { label: "Archivé",  color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const TABS = ["all", "unread", "read", "replied", "archived"];
const TAB_LABELS = { all: "Tous", unread: "Non lus", read: "Lus", replied: "Répondus", archived: "Archivés" };

function MessageRow({ msg, onPatch, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(msg.admin_notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const s = STATUS_LABELS[msg.status] || STATUS_LABELS.read;

  const patch = (fields) => onPatch(msg.id, fields);

  const handleMarkRead = () => {
    if (msg.status === "unread") patch({ status: "read" });
  };

  const handleExpand = () => {
    setExpanded((v) => !v);
    if (!expanded && msg.status === "unread") patch({ status: "read" });
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await onPatch(msg.id, { admin_notes: notes });
    setSavingNotes(false);
  };

  return (
    <div className={`border border-border/60 rounded-xl overflow-hidden transition-all ${msg.status === "unread" ? "border-primary/30 bg-primary/5" : "bg-card"}`}>
      {/* Header row */}
      <button
        onClick={handleExpand}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 grid sm:grid-cols-3 gap-1 items-center">
          <div className="min-w-0">
            <p className={`text-sm truncate ${msg.status === "unread" ? "font-bold" : "font-medium"}`}>{msg.name}</p>
            <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
          </div>
          <p className={`text-sm truncate col-span-1 ${msg.status === "unread" ? "font-semibold" : ""}`}>{msg.subject}</p>
          <div className="flex items-center gap-2 justify-end">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(msg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-border/40 px-4 py-4 space-y-4">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
          </div>

          {/* Notes admin */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes internes</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter une note visible uniquement par les admins…"
              rows={2}
              className="resize-none text-sm"
            />
            {notes !== (msg.admin_notes || "") && (
              <Button size="sm" variant="outline" onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? "Sauvegarde…" : "Sauvegarder"}
              </Button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}>
              <Button size="sm" className="gap-1.5" onClick={() => patch({ status: "replied", replied_at: new Date().toISOString() })}>
                <Reply className="w-3.5 h-3.5" /> Répondre
              </Button>
            </a>
            {msg.status !== "read" && msg.status !== "replied" && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => patch({ status: "read" })}>
                <CheckCheck className="w-3.5 h-3.5" /> Marquer lu
              </Button>
            )}
            {msg.status !== "archived" && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => patch({ status: "archived" })}>
                <Archive className="w-3.5 h-3.5" /> Archiver
              </Button>
            )}
            {msg.status === "archived" && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => patch({ status: "read" })}>
                Désarchiver
              </Button>
            )}
            <Button
              size="sm" variant="ghost"
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
              onClick={() => onDelete(msg.id)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Supprimer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminContactMessages() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin-contact-messages", activeTab],
    queryFn: () => apiFetch(`/contact${activeTab !== "all" ? `?status=${activeTab}` : ""}`),
    refetchOnMount: "always",
  });

  const patchMut = useMutation({
    mutationFn: ([id, fields]) => apiFetch(`/contact/${id}`, { method: "PATCH", body: JSON.stringify(fields) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      qc.invalidateQueries({ queryKey: ["contact-unread-count"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => apiFetch(`/contact/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Message supprimé");
      qc.invalidateQueries({ queryKey: ["admin-contact-messages"] });
      qc.invalidateQueries({ queryKey: ["contact-unread-count"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = messages.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            Messages de contact
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Messages reçus via le formulaire de contact public
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white text-sm px-3 py-1">
            {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher nom, email, sujet…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t ? "bg-white dark:bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement…</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Aucun message{search ? " correspondant à la recherche" : " dans cette catégorie"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              onPatch={(id, fields) => patchMut.mutate([id, fields])}
              onDelete={(id) => {
                if (confirm("Supprimer ce message définitivement ?")) deleteMut.mutate(id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
