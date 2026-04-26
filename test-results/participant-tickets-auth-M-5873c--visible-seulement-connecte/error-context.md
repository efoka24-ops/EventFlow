# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: participant-tickets-auth.spec.js >> Mes billets visible seulement connecte
- Location: tests\e2e\participant-tickets-auth.spec.js:15:1

# Error details

```
Error: page.goto: Target page, context or browser has been closed
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const createUnsignedJwt = (payload) => {
  4  |   const toBase64Url = (obj) =>
  5  |     Buffer.from(JSON.stringify(obj))
  6  |       .toString("base64")
  7  |       .replace(/=/g, "")
  8  |       .replace(/\+/g, "-")
  9  |       .replace(/\//g, "_");
  10 | 
  11 |   const header = { alg: "none", typ: "JWT" };
  12 |   return `${toBase64Url(header)}.${toBase64Url(payload)}.`;
  13 | };
  14 | 
  15 | test("Mes billets visible seulement connecte", async ({ page }) => {
> 16 | 
     |              ^ Error: page.goto: Target page, context or browser has been closed
  17 |   // Nettoie toute session participant AVANT navigation
  18 |   await page.context().addInitScript(() => {
  19 |     window.localStorage.removeItem("eventflow_participant_email");
  20 |   });
  21 | 
  22 |   await page.goto("/");
  23 |   // Par défaut, le bouton n'est pas visible sans session participant
  24 |   await expect(page.getByRole("button", { name: "Mes billets" })).toHaveCount(0);
  25 | 
  26 |   // Accès direct à la page tickets : input email visible si pas de session
  27 |   await page.goto("/participant/tickets");
  28 |     // Si l'input email n'est pas visible, vérifier que la page est bien chargée (titre)
  29 |     const emailInput = page.getByPlaceholder("votre@email.com");
  30 |     if (await emailInput.count() > 0) {
  31 |       await expect(emailInput).toBeVisible();
  32 |     } else {
  33 |       await expect(page.getByRole("heading", { name: "Mes billets" })).toBeVisible();
  34 |     }
  35 | 
  36 |   // Simule une session participant (email en localStorage) et force l'event pour MAJ Navbar
  37 |   await page.context().addInitScript(() => {
  38 |     window.localStorage.setItem("eventflow_participant_email", "e2e.participant@eventflow.local");
  39 |     window.dispatchEvent(new Event("participant-session-changed"));
  40 |   });
  41 | 
  42 |   // Recharge la page d'accueil
  43 |   await page.goto("/");
  44 |   // Le bouton "Mes billets" doit maintenant être visible
  45 |   await expect(page.getByRole("button", { name: "Mes billets" })).toBeVisible();
  46 | 
  47 |   // Accès à la page tickets : l'input email n'est plus visible, on voit l'espace participant
  48 |   await page.goto("/participant/tickets");
  49 |   await expect(page.getByText("Mini espace participant")).toBeVisible();
  50 | });
  51 | 
```