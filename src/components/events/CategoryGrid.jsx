import React from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants";
import { motion } from "framer-motion";

export default function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border/50">
      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">Parcourir par catégorie</h2>
      <p className="text-muted-foreground text-center mb-10">
        Trouvez l'événement parfait selon vos centres d'intérêt
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={`/events?category=${cat.value}`}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-medium text-center">{cat.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}