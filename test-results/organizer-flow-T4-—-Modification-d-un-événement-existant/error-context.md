# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: organizer-flow.spec.js >> T4 — Modification d'un événement existant
- Location: tests\e2e\organizer-flow.spec.js:197:1

# Error details

```
TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - banner:
        - link:
          - /url: /
          - text: EventFlow
          - generic: Organisateur
        - link:
          - /url: /submit-event
          - button:
            - img
            - text: Nouvel événement
      - generic:
        - complementary:
          - generic:
            - generic:
              - generic:
                - generic: E
              - generic:
                - paragraph: E2E Organisateur
                - paragraph: e2e.org.1777358686715@test.local
          - generic:
            - paragraph: Mon espace
            - link:
              - /url: /dashboard
              - generic:
                - img
                - generic: Vue d'ensemble
            - link:
              - /url: /submit-event
              - generic:
                - img
                - generic: Créer un événement
            - link:
              - /url: /dashboard/events
              - generic:
                - img
                - generic: Mes Événements
            - link:
              - /url: /dashboard/participants
              - generic:
                - img
                - generic: Participants
            - link:
              - /url: /dashboard/messages
              - generic:
                - img
                - generic: Messagerie
            - link:
              - /url: /dashboard/sponsors
              - generic:
                - img
                - generic: Sponsors
            - link:
              - /url: /dashboard/revenue
              - generic:
                - img
                - generic: Revenus
            - link:
              - /url: /dashboard/analytics
              - generic:
                - img
                - generic: Analytics
            - link:
              - /url: /dashboard/settings
              - generic:
                - img
                - generic: Paramètres
          - generic:
            - link:
              - /url: /
              - img
              - generic: Voir le site
            - button:
              - img
              - generic: Se déconnecter
        - main:
          - generic:
            - generic:
              - generic:
                - generic:
                  - generic: EO
                - generic:
                  - heading [level=1]: E2E Organisateur
                  - paragraph: e2e.org.1777358686715@test.local · Organisateur
              - button:
                - img
                - text: Créer un événement
            - generic:
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - img
                    - generic:
                      - paragraph: "1"
                      - paragraph: 1 à venir
                  - paragraph: Événements
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - img
                    - generic:
                      - paragraph: "0"
                      - paragraph: 0 validés
                  - paragraph: Participants
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - img
                    - generic:
                      - paragraph: 0 F
                      - paragraph: billets validés
                  - paragraph: Revenus estimés
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - img
                    - generic:
                      - paragraph: "0"
                      - paragraph: à traiter
                  - paragraph: En attente
            - generic:
              - generic:
                - tabpanel:
                  - generic:
                    - generic:
                      - generic: Mes événements (1)
                      - generic:
                        - button:
                          - img
                        - button:
                          - img
                          - text: Créer
                    - generic:
                      - generic:
                        - generic:
                          - generic:
                            - generic: avr.
                            - generic: "29"
                          - generic:
                            - generic:
                              - paragraph: "[E2E] Concert 1777358686715"
                              - generic:
                                - generic: À venir
                                - generic: Brouillon
                            - generic:
                              - generic:
                                - img
                                - text: Yaoundé
                              - generic:
                                - img
                                - text: 0 inscrits · 0 validés
                              - generic: 0.00 FCFA/billet
                          - generic:
                            - link:
                              - /url: /events/43ca393a-802e-408a-82e1-20c37c62d360
                              - button:
                                - img
                            - button:
                              - img
                            - button:
                              - img
    - region "Notifications alt+T"
  - dialog "Modifier l'événement" [ref=e2]:
    - generic [ref=e3]:
      - heading "Modifier l'événement" [level=2] [ref=e4]
      - paragraph [ref=e5]: Renseignez les informations de l'evenement puis validez pour enregistrer les changements.
    - generic [ref=e6]:
      - generic [ref=e7]:
        - text: Titre *
        - textbox [ref=e8]: "[E2E] Concert 1777358686715 — MODIFIÉ"
      - generic [ref=e9]:
        - text: Description
        - textbox [ref=e10]
      - generic [ref=e11]:
        - generic [ref=e12]:
          - text: Catégorie *
          - combobox [ref=e13] [cursor=pointer]:
            - generic: 📌 Autre
            - img [ref=e14]
          - combobox [ref=e16]
        - generic [ref=e17]:
          - text: Statut
          - combobox [ref=e18] [cursor=pointer]:
            - generic: Brouillon
            - img [ref=e19]
          - combobox [ref=e21]
      - generic [ref=e22]:
        - generic [ref=e23]:
          - text: Date de début *
          - textbox [active] [ref=e24]
        - generic [ref=e25]:
          - text: Date de fin
          - textbox [ref=e26]
      - generic [ref=e27]:
        - generic [ref=e28]:
          - text: Nom du lieu
          - textbox [ref=e29]
        - generic [ref=e30]:
          - text: Ville *
          - textbox [ref=e31]
      - generic [ref=e32]:
        - text: Adresse
        - textbox [ref=e33]
      - generic [ref=e34]:
        - generic [ref=e35]:
          - text: Max. participants
          - spinbutton [ref=e36]
        - generic [ref=e37]:
          - text: Prix (FCFA)
          - spinbutton [ref=e38]
      - generic [ref=e39]:
        - text: Image de l'événement
        - button "Cliquez pour sélectionner une image PNG, JPG, WEBP — depuis votre ordinateur" [ref=e40] [cursor=pointer]:
          - img [ref=e41]
          - generic [ref=e45]: Cliquez pour sélectionner une image
          - generic [ref=e46]: PNG, JPG, WEBP — depuis votre ordinateur
        - generic [ref=e48]:
          - text: "📏 Taille recommandée : 1200×630px (format paysage)."
          - text: L'image sera automatiquement redimensionnée. Vous pouvez recadrer l'image avant l'envoi.
      - generic [ref=e49]:
        - text: Tags (séparés par virgules)
        - textbox "musique, live, été" [ref=e50]
      - generic [ref=e51]:
        - button "Annuler" [ref=e52] [cursor=pointer]
        - button "Mettre à jour" [ref=e53] [cursor=pointer]
    - button "Close" [ref=e54] [cursor=pointer]:
      - img [ref=e55]
      - generic [ref=e58]: Close
```

# Test source

```ts
  120 | 
  121 | // ══════════════════════════════════════════════════════════════════════════════
  122 | // T2 — Accès dashboard : layout et navigation sidebar
  123 | // ══════════════════════════════════════════════════════════════════════════════
  124 | test("T2 — Dashboard organisateur : sidebar et navigation", async ({ page }) => {
  125 |   await injectToken(page, creatorToken);
  126 |   await page.goto("/dashboard");
  127 | 
  128 |   const sidebar = page.locator("aside").first();
  129 |   await expect(sidebar).toBeVisible({ timeout: 10_000 });
  130 | 
  131 |   // Items de navigation attendus dans le sidebar
  132 |   for (const label of ["Vue d'ensemble", "Mes Événements", "Participants", "Revenus", "Se déconnecter"]) {
  133 |     await expect(sidebar.getByText(label)).toBeVisible();
  134 |   }
  135 | 
  136 |   // Clic "Mes Événements" → URL change
  137 |   await sidebar.getByText("Mes Événements").click();
  138 |   await expect(page).toHaveURL(/\/dashboard\/events/, { timeout: 5_000 });
  139 | 
  140 |   // La section "Mes événements (N)" est toujours présente (avec 0 ou plus d'éléments)
  141 |   await expect(page.getByText(/Mes événements \(\d+\)/)).toBeVisible({ timeout: 8_000 });
  142 | 
  143 |   // Clic "Participants" → URL change
  144 |   await sidebar.getByText("Participants").click();
  145 |   await expect(page).toHaveURL(/\/dashboard\/participants/, { timeout: 5_000 });
  146 | });
  147 | 
  148 | // ══════════════════════════════════════════════════════════════════════════════
  149 | // T3 — Création d'un événement depuis le dashboard
  150 | // ══════════════════════════════════════════════════════════════════════════════
  151 | test("T3 — Création d'un événement depuis le dashboard", async ({ page }) => {
  152 |   await injectToken(page, creatorToken);
  153 |   await page.goto("/dashboard/events");
  154 | 
  155 |   // Bouton "Créer" ou "Créer un événement" dans le header de la section
  156 |   const createBtn = page.getByRole("button", { name: /Créer/i }).first();
  157 |   await expect(createBtn).toBeVisible({ timeout: 10_000 });
  158 |   await createBtn.click();
  159 | 
  160 |   // Dialog "Nouvel événement"
  161 |   const dialog = page.getByRole("dialog");
  162 |   await expect(dialog).toBeVisible({ timeout: 5_000 });
  163 |   await expect(dialog.getByText("Nouvel événement")).toBeVisible();
  164 | 
  165 |   // Shadcn Label et Input sont frères (pas d'association htmlFor/id).
  166 |   // On utilise le CSS sibling combinator : label:has-text("X") + input
  167 |   await inputAfterLabel(dialog, "Titre").fill(createdEventTitle);
  168 | 
  169 |   await dialog.locator("textarea").fill("Événement créé automatiquement par le test E2E Playwright.");
  170 | 
  171 |   // Date de début (premier input datetime-local)
  172 |   const tomorrow = new Date(Date.now() + 86_400_000);
  173 |   const pad = (n) => String(n).padStart(2, "0");
  174 |   const dateStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`;
  175 |   await dialog.locator("input[type='datetime-local']").first().fill(dateStr);
  176 | 
  177 |   // Ville (label-adjacent pour éviter les problèmes de scroll/position)
  178 |   await inputAfterLabel(dialog, "Ville").scrollIntoViewIfNeeded();
  179 |   await inputAfterLabel(dialog, "Ville").fill("Yaoundé");
  180 | 
  181 |   // Soumettre → "Créer l'événement"
  182 |   await dialog.getByRole("button", { name: /Créer l'événement/i }).click();
  183 | 
  184 |   // Toast de confirmation
  185 |   await expect(page.getByText("Événement créé !")).toBeVisible({ timeout: 12_000 });
  186 | 
  187 |   // Dialog fermé
  188 |   await expect(dialog).toHaveCount(0, { timeout: 5_000 });
  189 | 
  190 |   // L'événement apparaît dans la liste (React Query invalidé)
  191 |   await expect(page.getByText(createdEventTitle)).toBeVisible({ timeout: 12_000 });
  192 | });
  193 | 
  194 | // ══════════════════════════════════════════════════════════════════════════════
  195 | // T4 — Modification de l'événement créé en T3
  196 | // ══════════════════════════════════════════════════════════════════════════════
  197 | test("T4 — Modification d'un événement existant", async ({ page }) => {
  198 |   await injectToken(page, creatorToken);
  199 |   await page.goto("/dashboard/events");
  200 | 
  201 |   // Attendre que l'événement de T3 soit visible
  202 |   await expect(page.getByText(createdEventTitle)).toBeVisible({ timeout: 12_000 });
  203 | 
  204 |   // Bouton Modifier (attribut title="Modifier" sur l'icône crayon)
  205 |   await page.locator('[title="Modifier"]').first().click();
  206 | 
  207 |   // Dialog en mode édition
  208 |   const dialog = page.getByRole("dialog");
  209 |   await expect(dialog).toBeVisible({ timeout: 5_000 });
  210 |   await expect(dialog.getByText("Modifier l'événement")).toBeVisible();
  211 | 
  212 |   // Modifier le titre
  213 |   const updatedTitle = `${createdEventTitle} — MODIFIÉ`;
  214 |   const titleInput = inputAfterLabel(dialog, "Titre");
  215 |   await titleInput.clear();
  216 |   await titleInput.fill(updatedTitle);
  217 | 
  218 |   // Enregistrer → "Mettre à jour" ; intercepter la réponse PATCH pour diagnostiquer
  219 |   const [patchRes] = await Promise.all([
> 220 |     page.waitForResponse(
      |          ^ TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
  221 |       (r) => /\/api\/events\//.test(r.url()) && r.request().method() === "PATCH",
  222 |       { timeout: 15_000 }
  223 |     ),
  224 |     dialog.getByRole("button", { name: /Mettre à jour/i }).click(),
  225 |   ]);
  226 | 
  227 |   // Vérifier que le PATCH a réussi (2xx)
  228 |   const patchStatus = patchRes.status();
  229 |   const patchBody = await patchRes.text().catch(() => "");
  230 |   expect(patchStatus, `PATCH /events/:id a échoué (${patchStatus}): ${patchBody}`).toBeLessThan(300);
  231 | 
  232 |   // Toast de confirmation
  233 |   await expect(page.getByText("Événement mis à jour !")).toBeVisible({ timeout: 8_000 });
  234 | 
  235 |   // Dialog fermé
  236 |   await expect(dialog).toHaveCount(0, { timeout: 5_000 });
  237 | 
  238 |   // Nouveau titre visible dans la liste
  239 |   await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 12_000 });
  240 | 
  241 |   createdEventTitle = updatedTitle;
  242 | });
  243 | 
  244 | // ══════════════════════════════════════════════════════════════════════════════
  245 | // T5 — Déconnexion et protection de la route /dashboard
  246 | // ══════════════════════════════════════════════════════════════════════════════
  247 | test("T5 — Déconnexion et protection de la route /dashboard", async ({ page }) => {
  248 |   // setTokenOnce (evaluate) plutôt que injectToken (addInitScript).
  249 |   // addInitScript réinjecte le token après la navigation déclenchée par logout,
  250 |   // ce qui ferait échouer la vérification "token supprimé".
  251 |   await page.goto("/");
  252 |   await setTokenOnce(page, creatorToken);
  253 |   await page.goto("/dashboard");
  254 | 
  255 |   // Sidebar visible
  256 |   const sidebar = page.locator("aside").first();
  257 |   await expect(sidebar).toBeVisible({ timeout: 10_000 });
  258 | 
  259 |   // Cliquer "Se déconnecter"
  260 |   await sidebar.getByText("Se déconnecter").click();
  261 | 
  262 |   // Retour à la home après déconnexion
  263 |   await page.waitForURL("http://localhost:5173/", { timeout: 10_000 });
  264 | 
  265 |   // Token supprimé du localStorage
  266 |   const token = await page.evaluate(() =>
  267 |     window.localStorage.getItem("eventflow_creator_token")
  268 |   );
  269 |   expect(token).toBeNull();
  270 | 
  271 |   // Tentative d'accès direct au dashboard → redirect vers /submit-event
  272 |   await page.goto("/dashboard");
  273 |   await page.waitForURL(/\/submit-event/, { timeout: 10_000 });
  274 |   await expect(page.getByText("Votre compte organisateur")).toBeVisible({ timeout: 5_000 });
  275 | });
  276 | 
```