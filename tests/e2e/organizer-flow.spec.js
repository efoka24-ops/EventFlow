/**
 * E2E — Flux organisateur
 * Couvre : connexion, accès dashboard, création d'événement,
 *           modification d'événement, déconnexion.
 *
 * Prérequis : frontend (npm run dev) ET backend (cd backend && npm run dev)
 * Lancer avec : npx playwright test organizer-flow
 */
import { test, expect } from "@playwright/test";

// ── Compte de test unique par exécution ───────────────────────────────────────
const TS            = Date.now();
const TEST_EMAIL    = `e2e.org.${TS}@test.local`;
const TEST_PHONE    = `+2376${String(TS).slice(-7)}`;
const TEST_PASSWORD = "test1234";
const TEST_NAME     = "E2E Organisateur";
// Node.js 18+ résout "localhost" → ::1 (IPv6) ; le backend écoute sur 127.0.0.1 (IPv4).
const API_BASE      = "http://127.0.0.1:3001/api";

let creatorToken = "";
let createdEventTitle = `[E2E] Concert ${TS}`;

// ── Mock public-settings ──────────────────────────────────────────────────────
// Évite le spinner de chargement et le blocage maintenance_mode.
const PUBLIC_SETTINGS_MOCK = {
  maintenance_mode: false,
  platform_name: "EventFlow",
  promo_banner_active: false,
  promo_banner_text: "",
  homepage_hero_title: "Test",
  homepage_hero_subtitle: "Test",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/public-settings", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(PUBLIC_SETTINGS_MOCK) })
  );
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Injecte le JWT via addInitScript (réexécuté à chaque navigation dans la page).
 * À utiliser pour T2/T3/T4 où l'on veut rester connecté après un changement d'URL.
 */
const injectToken = (page, token) =>
  page.addInitScript(
    ({ key, val }) => window.localStorage.setItem(key, val),
    { key: "eventflow_creator_token", val: token }
  );

/**
 * Injecte le JWT via page.evaluate (une seule fois, pas de ré-injection après navigation).
 * À utiliser pour T5 où on teste le logout.
 */
const setTokenOnce = async (page, token) => {
  await page.evaluate(
    ({ key, val }) => window.localStorage.setItem(key, val),
    { key: "eventflow_creator_token", val: token }
  );
};

/**
 * Trouve l'<input> qui suit immédiatement un <label> contenant le texte donné.
 * Plus robuste que nth() qui dépend de la position.
 */
const inputAfterLabel = (dialog, labelText) =>
  dialog.locator(`label:has-text("${labelText}") + input`);

// ── Setup : créer le compte de test via API (avec retry) ──────────────────────
test.beforeAll(async ({ request }) => {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
    const res = await request.post(`${API_BASE}/auth/creator/signup`, {
      data: { full_name: TEST_NAME, email: TEST_EMAIL, phone: TEST_PHONE, password: TEST_PASSWORD },
    });
    if (res.ok()) {
      const body = await res.json();
      creatorToken = body.token;
      expect(creatorToken).toBeTruthy();
      return;
    }
    lastError = `${res.status()} — ${await res.text()}`;
  }
  throw new Error(`Création du compte de test échouée après 3 tentatives : ${lastError}`);
});

// ══════════════════════════════════════════════════════════════════════════════
// T1 — Connexion organisateur via le formulaire UI
// ══════════════════════════════════════════════════════════════════════════════
test("T1 — Connexion organisateur via formulaire", async ({ page }) => {
  await page.goto("/submit-event?auth=login");

  // Formulaire de connexion visible
  await expect(page.getByText("Votre compte organisateur")).toBeVisible({ timeout: 10_000 });

  // Remplir identifiant + mot de passe, soumettre via Enter
  await page.getByPlaceholder("vous@email.com ou +237 6XX XX XX").fill(TEST_EMAIL);
  const pwdInput = page.getByPlaceholder("••••••••");
  await pwdInput.fill(TEST_PASSWORD);
  // 3 boutons "Se connecter" coexistent (Navbar + tab toggle + submit).
  // Enter sur le champ password déclenche handleLogin directement.
  await pwdInput.press("Enter");

  // Après login → redirection vers /dashboard
  // Regex plutôt que glob : "**/dashboard" ne matche pas l'URL complète dans Playwright.
  await page.waitForURL(/\/dashboard/, { timeout: 12_000 });

  // Le JWT est stocké (3 segments = format JWT valide)
  const token = await page.evaluate(() =>
    window.localStorage.getItem("eventflow_creator_token")
  );
  expect(token).toBeTruthy();
  expect(token.split(".").length).toBe(3);

  // Note : la vérification visuelle du sidebar est couverte par T2.
  // Ici on valide uniquement que le login produit un token et redirige.
});

// ══════════════════════════════════════════════════════════════════════════════
// T2 — Accès dashboard : layout et navigation sidebar
// ══════════════════════════════════════════════════════════════════════════════
test("T2 — Dashboard organisateur : sidebar et navigation", async ({ page }) => {
  await injectToken(page, creatorToken);
  await page.goto("/dashboard");

  const sidebar = page.locator("aside").first();
  await expect(sidebar).toBeVisible({ timeout: 10_000 });

  // Items de navigation attendus dans le sidebar
  for (const label of ["Vue d'ensemble", "Mes Événements", "Participants", "Revenus", "Se déconnecter"]) {
    await expect(sidebar.getByText(label)).toBeVisible();
  }

  // Clic "Mes Événements" → URL change
  await sidebar.getByText("Mes Événements").click();
  await expect(page).toHaveURL(/\/dashboard\/events/, { timeout: 5_000 });

  // La section "Mes événements (N)" est toujours présente (avec 0 ou plus d'éléments)
  await expect(page.getByText(/Mes événements \(\d+\)/)).toBeVisible({ timeout: 8_000 });

  // Clic "Participants" → URL change
  await sidebar.getByText("Participants").click();
  await expect(page).toHaveURL(/\/dashboard\/participants/, { timeout: 5_000 });
});

// ══════════════════════════════════════════════════════════════════════════════
// T3 — Création d'un événement depuis le dashboard
// ══════════════════════════════════════════════════════════════════════════════
test("T3 — Création d'un événement depuis le dashboard", async ({ page }) => {
  await injectToken(page, creatorToken);
  await page.goto("/dashboard/events");

  // Bouton "Créer" ou "Créer un événement" dans le header de la section
  const createBtn = page.getByRole("button", { name: /Créer/i }).first();
  await expect(createBtn).toBeVisible({ timeout: 10_000 });
  await createBtn.click();

  // Dialog "Nouvel événement"
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await expect(dialog.getByText("Nouvel événement")).toBeVisible();

  // Shadcn Label et Input sont frères (pas d'association htmlFor/id).
  // On utilise le CSS sibling combinator : label:has-text("X") + input
  await inputAfterLabel(dialog, "Titre").fill(createdEventTitle);

  await dialog.locator("textarea").fill("Événement créé automatiquement par le test E2E Playwright.");

  // Date de début (premier input datetime-local)
  const tomorrow = new Date(Date.now() + 86_400_000);
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`;
  await dialog.locator("input[type='datetime-local']").first().fill(dateStr);

  // Ville (label-adjacent pour éviter les problèmes de scroll/position)
  await inputAfterLabel(dialog, "Ville").scrollIntoViewIfNeeded();
  await inputAfterLabel(dialog, "Ville").fill("Yaoundé");

  // Soumettre → "Créer l'événement"
  await dialog.getByRole("button", { name: /Créer l'événement/i }).click();

  // Toast de confirmation
  await expect(page.getByText("Événement créé !")).toBeVisible({ timeout: 12_000 });

  // Dialog fermé
  await expect(dialog).toHaveCount(0, { timeout: 5_000 });

  // L'événement apparaît dans la liste (React Query invalidé)
  await expect(page.getByText(createdEventTitle)).toBeVisible({ timeout: 12_000 });
});

// ══════════════════════════════════════════════════════════════════════════════
// T4 — Modification de l'événement créé en T3
// ══════════════════════════════════════════════════════════════════════════════
test("T4 — Modification d'un événement existant", async ({ page }) => {
  await injectToken(page, creatorToken);
  await page.goto("/dashboard/events");

  // Attendre que l'événement de T3 soit visible
  const eventRow = page.locator("div, li, tr").filter({ hasText: createdEventTitle }).first();
  await expect(eventRow).toBeVisible({ timeout: 12_000 });

  // Cliquer le bouton Modifier le plus proche de la ligne de l'événement
  await eventRow.locator('[title="Modifier"]').click();

  // Dialog en mode édition
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  await expect(dialog.getByText("Modifier l'événement")).toBeVisible();

  // Modifier le titre
  const updatedTitle = `${createdEventTitle} — MODIFIÉ`;
  const titleInput = inputAfterLabel(dialog, "Titre");
  await titleInput.clear();
  await titleInput.fill(updatedTitle);

  // Intercepter la réponse PATCH pour diagnostiquer
  const patchPromise = page.waitForResponse(
    (resp) => resp.request().method() === "PATCH" && resp.url().includes("/events/"),
    { timeout: 12_000 }
  ).catch(() => null);

  // Diagnostiquer l'état du formulaire avant soumission
  const formInfo = await dialog.locator("form").evaluate((f) => ({
    tagName: f.tagName,
    noValidate: f.noValidate,
    fields: f.elements.length,
    hasRequestSubmit: typeof f.requestSubmit === "function",
    submitBtnDisabled: f.querySelector('[type="submit"]')?.disabled,
  }));
  console.log("Form info:", JSON.stringify(formInfo));

  // requestSubmit() déclenche l'événement submit + respecte noValidate (pas de validation native)
  await dialog.locator("form").evaluate((f) => f.requestSubmit());

  const patchResp = await patchPromise;
  if (patchResp) {
    const body = await patchResp.text().catch(() => "");
    expect(patchResp.status(), `PATCH failed (${patchResp.status()}): ${body}`).toBe(200);
  } else {
    throw new Error("Aucune requête PATCH /events/:id — la soumission du formulaire n'a pas été déclenchée");
  }

  // Le dialog se ferme uniquement sur succès (onClose appelé après toast.success)
  await expect(dialog).toHaveCount(0, { timeout: 10_000 });

  // Nouveau titre visible dans la liste (preuve que React Query a invalidé)
  await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 12_000 });

  createdEventTitle = updatedTitle;
});

// ══════════════════════════════════════════════════════════════════════════════
// T5 — Déconnexion et protection de la route /dashboard
// ══════════════════════════════════════════════════════════════════════════════
test("T5 — Déconnexion et protection de la route /dashboard", async ({ page }) => {
  // setTokenOnce (evaluate) plutôt que injectToken (addInitScript).
  // addInitScript réinjecte le token après la navigation déclenchée par logout,
  // ce qui ferait échouer la vérification "token supprimé".
  await page.goto("/");
  await setTokenOnce(page, creatorToken);
  await page.goto("/dashboard");

  // Sidebar visible
  const sidebar = page.locator("aside").first();
  await expect(sidebar).toBeVisible({ timeout: 10_000 });

  // Cliquer "Se déconnecter"
  await sidebar.getByText("Se déconnecter").click();

  // Retour à la home après déconnexion
  await page.waitForURL("http://localhost:5173/", { timeout: 10_000 });

  // Token supprimé du localStorage
  const token = await page.evaluate(() =>
    window.localStorage.getItem("eventflow_creator_token")
  );
  expect(token).toBeNull();

  // Tentative d'accès direct au dashboard → redirect vers /submit-event
  await page.goto("/dashboard");
  await page.waitForURL(/\/submit-event/, { timeout: 10_000 });
  await expect(page.getByText("Votre compte organisateur")).toBeVisible({ timeout: 5_000 });
});
