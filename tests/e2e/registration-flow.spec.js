/**
 * E2E — Flux inscription participant + gestion admin des champs de formulaire
 * Couvre :
 *   R1 — Inscription à un événement gratuit (formulaire public)
 *   R2 — Champs personnalisés visibles dans le formulaire d'inscription
 *   A1 — Admin : ajout d'un champ personnalisé sur un événement
 *   A2 — Admin : masquer / réactiver un champ
 *   A3 — Admin : supprimer un champ
 *
 * Prérequis : frontend (npm run dev) ET backend (cd backend && npm run dev)
 */
import { test, expect } from "@playwright/test";

const TS       = Date.now();
const API_BASE = "http://127.0.0.1:3001/api";

const PUBLIC_SETTINGS_MOCK = {
  maintenance_mode: false,
  platform_name: "EventFlow",
  promo_banner_active: false,
  promo_banner_text: "",
  homepage_hero_title: "Test",
  homepage_hero_subtitle: "Test",
};

// Shared state across tests in this file
let adminToken = "";
let eventId    = "";
const eventTitle = `[E2E-REG] Événement ${TS}`;

// Helper : appel fetch natif (dispo depuis Node 18)
const apiFetch = (path, { headers: extraHeaders = {}, body, ...restOpts } = {}) =>
  fetch(`${API_BASE}${path}`, {
    ...restOpts,
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: body != null ? JSON.stringify(body) : undefined,
  });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/public-settings", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(PUBLIC_SETTINGS_MOCK) })
  );
});

// ── Setup : admin login + créer + approuver un événement de test ──────────────
test.beforeAll(async () => {
  // Admin login
  const loginRes = await apiFetch("/auth/admin/login", {
    method: "POST",
    body: { email: "admin@eventflow.com", password: "admin1234" },
  });
  if (!loginRes.ok) throw new Error(`Admin login failed: ${await loginRes.text()}`);
  adminToken = (await loginRes.json()).token;

  // Créer un organisateur temporaire
  const orgRes = await apiFetch("/auth/creator/signup", {
    method: "POST",
    body: {
      full_name: "Organisateur E2E Reg",
      email: `e2e.reg.${TS}@test.local`,
      phone: `+2376${String(TS).slice(-7)}`,
      password: "test1234",
    },
  });
  if (!orgRes.ok) throw new Error(`Creator signup failed: ${await orgRes.text()}`);
  const orgToken = (await orgRes.json()).token;

  // Créer un événement via l'API organisateur
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
  const evtRes = await apiFetch("/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${orgToken}` },
    body: {
      title: eventTitle,
      description: "Événement de test E2E pour l'inscription.",
      category: "autre",
      date_start: tomorrow,
      city: "Douala",
      price: 0,
    },
  });
  if (!evtRes.ok) throw new Error(`Event creation failed: ${await evtRes.text()}`);
  eventId = (await evtRes.json()).id;

  // Approuver + publier via admin
  await apiFetch(`/admin/events/${eventId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { status: "approved" },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// R1 — Inscription à un événement gratuit
// ══════════════════════════════════════════════════════════════════════════════
test("R1 — Inscription à un événement gratuit", async ({ page }) => {
  await page.goto(`/events/${eventId}`);

  // Page de l'événement chargée
  await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 12_000 });

  // Bouton d'inscription
  const registerBtn = page.getByRole("button", { name: /S'inscrire|Inscription|Réserver/i }).first();
  await expect(registerBtn).toBeVisible({ timeout: 8_000 });
  await registerBtn.click();

  // Formulaire d'inscription visible
  const form = page.locator("form").filter({ hasText: /Prénom|Nom|Email/i }).first();
  await expect(form).toBeVisible({ timeout: 8_000 });

  // Remplir les champs obligatoires
  const firstNameInput = form.getByPlaceholder(/Prénom/i).first();
  const lastNameInput  = form.getByPlaceholder(/^Nom/i).first();
  const emailInput     = form.getByPlaceholder(/email/i).first();

  if (await firstNameInput.count() > 0) await firstNameInput.fill("Test");
  if (await lastNameInput.count() > 0)  await lastNameInput.fill("Participant");
  if (await emailInput.count() > 0)     await emailInput.fill(`participant.${TS}@test.local`);

  // Soumettre via JS pour éviter les problèmes d'overlay
  const submitBtn = form.getByRole("button", { name: /Confirmer|Valider|S'inscrire|Envoyer/i }).first();
  await submitBtn.evaluate((btn) => btn.click());

  // Toast / message de confirmation
  await expect(
    page.getByText(/inscription|confirmé|enregistr|succès|merci/i).first()
  ).toBeVisible({ timeout: 15_000 });
});

// ══════════════════════════════════════════════════════════════════════════════
// A1 — Admin : ajout d'un champ personnalisé
// ══════════════════════════════════════════════════════════════════════════════
test("A1 — Admin : ajout d'un champ personnalisé sur un événement", async ({ page }) => {
  await page.addInitScript(
    ({ key, val }) => window.localStorage.setItem(key, val),
    { key: "eventflow_admin_token", val: adminToken }
  );

  await page.goto("/admin/events");
  await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 10_000 });

  // Ouvrir le menu d'actions (⋯) de la ligne de l'événement
  const row = page.locator("tr").filter({ hasText: eventTitle }).first();
  await row.getByRole("button").last().click();
  await page.getByText("Champs du formulaire").click();

  // Dialog ouvert
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Champs du formulaire d'inscription")).toBeVisible({ timeout: 5_000 });

  // Cliquer "Ajouter un champ"
  await dialog.getByRole("button", { name: /Ajouter un champ/i }).click();
  await expect(dialog.getByText("Nouveau champ")).toBeVisible({ timeout: 3_000 });

  // Remplir le libellé (placeholder partiel suffit)
  await dialog.getByPlaceholder(/Âge/).fill("Âge");

  // La clé technique doit s'auto-remplir à "age"
  await expect(dialog.locator("input[value='age']")).toBeVisible({ timeout: 3_000 });

  // Switch "Obligatoire"
  await dialog.locator("#fld-required").evaluate((el) => {
    if (!el.getAttribute("data-state") || el.getAttribute("data-state") === "unchecked") el.click();
  });

  // Créer le champ
  await dialog.getByRole("button", { name: /Créer le champ/i }).evaluate((btn) => btn.click());

  // Le champ apparaît dans la liste
  await expect(dialog.getByText("Âge")).toBeVisible({ timeout: 8_000 });
  await expect(dialog.getByText("obligatoire")).toBeVisible();

  await page.keyboard.press("Escape");
});

// ══════════════════════════════════════════════════════════════════════════════
// A2 — Admin : masquer / réactiver un champ
// ══════════════════════════════════════════════════════════════════════════════
test("A2 — Admin : masquer et réactiver un champ", async ({ page }) => {
  await page.addInitScript(
    ({ key, val }) => window.localStorage.setItem(key, val),
    { key: "eventflow_admin_token", val: adminToken }
  );

  await page.goto("/admin/events");
  await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 10_000 });

  const row = page.locator("tr").filter({ hasText: eventTitle }).first();
  await row.getByRole("button").last().click();
  await page.getByText("Champs du formulaire").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Âge")).toBeVisible({ timeout: 8_000 });

  // Masquer
  await dialog.getByTitle("Masquer").first().click();
  await expect(dialog.getByText("masqué")).toBeVisible({ timeout: 5_000 });

  // Réactiver
  await dialog.getByTitle("Afficher").first().click();
  await expect(dialog.getByText("masqué")).toHaveCount(0, { timeout: 5_000 });

  await page.keyboard.press("Escape");
});

// ══════════════════════════════════════════════════════════════════════════════
// A3 — Admin : supprimer un champ
// ══════════════════════════════════════════════════════════════════════════════
test("A3 — Admin : supprimer un champ", async ({ page }) => {
  await page.addInitScript(
    ({ key, val }) => window.localStorage.setItem(key, val),
    { key: "eventflow_admin_token", val: adminToken }
  );

  await page.goto("/admin/events");
  await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 10_000 });

  const row = page.locator("tr").filter({ hasText: eventTitle }).first();
  await row.getByRole("button").last().click();
  await page.getByText("Champs du formulaire").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Âge")).toBeVisible({ timeout: 8_000 });

  await dialog.getByTitle("Supprimer").first().click();

  await expect(dialog.getByText("Âge")).toHaveCount(0, { timeout: 8_000 });
  await expect(dialog.getByText(/Aucun champ personnalisé/)).toBeVisible({ timeout: 5_000 });

  await page.keyboard.press("Escape");
});

// ══════════════════════════════════════════════════════════════════════════════
// R2 — Champ personnalisé visible dans le formulaire d'inscription
// ══════════════════════════════════════════════════════════════════════════════
test("R2 — Champ personnalisé affiché dans le formulaire d'inscription", async ({ page }) => {
  // Créer le champ via API native fetch
  await apiFetch("/form-fields", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      event_id: eventId,
      field_key: "ville_residence",
      field_label: "Ville de résidence",
      field_type: "text",
      is_required: false,
      is_visible: true,
      sort_order: 1,
    },
  });

  await page.goto(`/events/${eventId}`);
  await expect(page.getByText(eventTitle)).toBeVisible({ timeout: 12_000 });

  const registerBtn = page.getByRole("button", { name: /S'inscrire|Inscription|Réserver/i }).first();
  await registerBtn.click();

  // Le champ personnalisé est visible dans le formulaire
  await expect(page.getByText("Ville de résidence")).toBeVisible({ timeout: 10_000 });
});
