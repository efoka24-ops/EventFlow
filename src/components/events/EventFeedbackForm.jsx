import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackUserAction } from "@/lib/trackUserAction";

export default function EventFeedbackForm({ event }) {
  const queryClient = useQueryClient();
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);

  const { data: feedbackItems = [] } = useQuery({
    queryKey: ["event-feedback", event.id],
    queryFn: () => base44.entities.EventFeedback.filter({ event_id: event.id }, "-created_date"),
    refetchOnMount: "always",
  });

  const averageRating = useMemo(() => {
    if (feedbackItems.length === 0) return null;
    const sum = feedbackItems.reduce((acc, item) => acc + Number(item.rating || 0), 0);
    return (sum / feedbackItems.length).toFixed(1);
  }, [feedbackItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.EventFeedback.create({
        event_id: event.id,
        event_title: event.title,
        participant_name: participantName || "Anonyme",
        participant_email: participantEmail.trim().toLowerCase(),
        rating: Number(rating),
        comment,
      });
      trackUserAction({
        action: "event_feedback_submitted",
        user_email: participantEmail.trim().toLowerCase(),
        event_id: event.id,
        event_title: event.title,
        event_category: event.category,
        context: "event_feedback",
        metadata: { rating: Number(rating) },
      });
      toast.success("Merci pour votre retour !");
      setComment("");
      setParticipantName("");
      setParticipantEmail("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["event-feedback", event.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
    } catch {
      toast.error("Impossible d'envoyer le feedback pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Donner votre avis</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom</Label>
                <Input value={participantName} onChange={(e) => setParticipantName(e.target.value)} placeholder="Votre nom" />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input required type="email" value={participantEmail} onChange={(e) => setParticipantEmail(e.target.value)} placeholder="vous@exemple.com" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Note</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="p-1"
                      aria-label={`Noter ${value} sur 5`}
                    >
                      <Star className={`w-5 h-5 ${value <= rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Commentaire</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Partagez votre expérience..." />
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Envoyer mon feedback
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retours participants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {feedbackItems.length} retour(s){averageRating ? ` · Note moyenne ${averageRating}/5` : ""}
          </p>
          {feedbackItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun feedback pour le moment.</p>
          ) : (
            feedbackItems.slice(0, 8).map((item) => (
              <div key={item.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{item.participant_name || "Anonyme"}</p>
                  <p className="text-xs text-muted-foreground">{item.rating}/5</p>
                </div>
                <p className="text-sm text-muted-foreground">{item.comment || "Aucun commentaire"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
