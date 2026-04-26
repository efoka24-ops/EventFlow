import { Router } from "express";
import { query } from "../db.js";
import { ensurePlatformSettings } from "../services/platformSettings.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    await ensurePlatformSettings(query, [
      "platform_name",
      "homepage_hero_title",
      "homepage_hero_subtitle",
      "promo_banner_active",
      "promo_banner_text",
    ]);

    const result = await query(
      `SELECT key, value FROM platform_settings
       WHERE key IN (
         'platform_name',
         'homepage_hero_title',
         'homepage_hero_subtitle',
         'promo_banner_active',
         'promo_banner_text'
       )`
    );

    const settings = Object.fromEntries(result.rows.map((row) => [row.key, row.value]));

    res.json({
      platform_name: settings.platform_name || "EventFlow",
      homepage_hero_title: settings.homepage_hero_title || "Découvrez les meilleurs événements",
      homepage_hero_subtitle:
        settings.homepage_hero_subtitle ||
        "Trouvez et réservez vos événements préférés en quelques clics",
      promo_banner_active: settings.promo_banner_active === "true",
      promo_banner_text: settings.promo_banner_text || "",
    });
  } catch (err) {
    next(err);
  }
});

export default router;
