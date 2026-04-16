import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search } from "lucide-react";

export default function Help() {
  const [search, setSearch] = useState("");
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["help-articles"],
    queryFn: () => base44.entities.HelpArticle.list("topic_order"),
    refetchOnMount: "always",
  });

  const normalizedSearch = search.trim().toLowerCase();

  const topics = useMemo(() => {
    const grouped = new Map();
    articles.forEach((article) => {
      const key = article.topic_id || "general";
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          title: article.topic_title || "Général",
          description: article.topic_description || "",
          topic_order: Number(article.topic_order || 0),
          articles: [],
        });
      }
      grouped.get(key).articles.push(article);
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.topic_order - b.topic_order)
      .map((topic) => ({
        ...topic,
        articles: [...topic.articles].sort(
          (a, b) => Number(a.article_order || 0) - Number(b.article_order || 0)
        ),
      }));
  }, [articles]);

  const filteredTopics = useMemo(() => {
    if (!normalizedSearch) return topics;

    return topics
      .map((topic) => {
        const topicMatches = topic.title.toLowerCase().includes(normalizedSearch);
        const articles = topic.articles.filter(
          (article) =>
            article.title.toLowerCase().includes(normalizedSearch) ||
            article.content.toLowerCase().includes(normalizedSearch)
        );

        if (topicMatches) return topic;
        return { ...topic, articles };
      })
      .filter((topic) => topic.articles.length > 0);
  }, [normalizedSearch, topics]);

  const totalArticles = filteredTopics.reduce((sum, topic) => sum + topic.articles.length, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
          <BookOpen className="w-4 h-4" />
          Centre d'aide
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Aide utilisateurs</h1>
        <p className="text-muted-foreground max-w-3xl">
          Parcourez les articles par sujet pour résoudre rapidement les questions sur les inscriptions,
          la création d'événements et la gestion admin.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article ou un sujet"
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{filteredTopics.length} sujet(s)</Badge>
        <Badge variant="outline">{totalArticles} article(s)</Badge>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Chargement des articles d'aide...</CardContent>
        </Card>
      ) : filteredTopics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-semibold">Aucun résultat</p>
            <p className="text-sm text-muted-foreground">Essayez avec un autre mot-clé.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredTopics.map((topic) => (
            <section key={topic.id} className="space-y-3">
              <div>
                <h2 className="text-xl font-bold">{topic.title}</h2>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topic.articles.map((article) => (
                  <Card key={article.id} className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base leading-snug">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{article.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
