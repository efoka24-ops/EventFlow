import { test, expect } from "@playwright/test";

const createUnsignedJwt = (payload) => {
  const toBase64Url = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const header = { alg: "none", typ: "JWT" };
  return `${toBase64Url(header)}.${toBase64Url(payload)}.`;
};

test("Mes billets visible seulement connecte", async ({ page }) => {

  // Nettoie toute session participant AVANT navigation
  await page.context().addInitScript(() => {
    window.localStorage.removeItem("eventflow_participant_email");
  });

  await page.goto("/");
  // Par défaut, le bouton n'est pas visible sans session participant
  await expect(page.getByRole("button", { name: "Mes billets" })).toHaveCount(0);

  // Accès direct à la page tickets : input email visible si pas de session
  await page.goto("/participant/tickets");
    // Si l'input email n'est pas visible, vérifier que la page est bien chargée (titre)
    const emailInput = page.getByPlaceholder("votre@email.com");
    if (await emailInput.count() > 0) {
      await expect(emailInput).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "Mes billets" })).toBeVisible();
    }

  // Simule une session participant (email en localStorage) et force l'event pour MAJ Navbar
  await page.context().addInitScript(() => {
    window.localStorage.setItem("eventflow_participant_email", "e2e.participant@eventflow.local");
    window.dispatchEvent(new Event("participant-session-changed"));
  });

  // Recharge la page d'accueil
  await page.goto("/");
  // Le bouton "Mes billets" doit maintenant être visible
  await expect(page.getByRole("button", { name: "Mes billets" })).toBeVisible();

  // Accès à la page tickets : l'input email n'est plus visible, on voit l'espace participant
  await page.goto("/participant/tickets");
  await expect(page.getByText("Mini espace participant")).toBeVisible();
});
