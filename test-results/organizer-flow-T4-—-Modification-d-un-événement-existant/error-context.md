# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: organizer-flow.spec.js >> T4 — Modification d'un événement existant
- Location: tests\e2e\organizer-flow.spec.js:197:1

# Error details

```
Error: Aucune requête PATCH /events/:id — la soumission du formulaire n'a pas été déclenchée
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
                - paragraph: e2e.org.1777392888928@test.local
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
                  - paragraph: e2e.org.1777392888928@test.local · Organisateur
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
                              - paragraph: "[E2E] Concert 1777392888928"
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
                              - /url: /events/b6e3f858-5010-446e-9280-66359f6fa8d8
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
        - textbox [active] [ref=e8]: "[E2E] Concert 1777392888928 — MODIFIÉ"
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
          - textbox [ref=e24]
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
  202 |   const eventRow = page.locator("div, li, tr").filter({ hasText: createdEventTitle }).first();
  203 |   await expect(eventRow).toBeVisible({ timeout: 12_000 });
  204 | 
  205 |   // Cliquer le bouton Modifier le plus proche de la ligne de l'événement
  206 |   await eventRow.locator('[title="Modifier"]').click();
  207 | 
  208 |   // Dialog en mode édition
  209 |   const dialog = page.getByRole("dialog");
  210 |   await expect(dialog).toBeVisible({ timeout: 5_000 });
  211 |   await expect(dialog.getByText("Modifier l'événement")).toBeVisible();
  212 | 
  213 |   // Modifier le titre
  214 |   const updatedTitle = `${createdEventTitle} — MODIFIÉ`;
  215 |   const titleInput = inputAfterLabel(dialog, "Titre");
  216 |   await titleInput.clear();
  217 |   await titleInput.fill(updatedTitle);
  218 | 
  219 |   // Intercepter la réponse PATCH pour diagnostiquer
  220 |   const patchPromise = page.waitForResponse(
  221 |     (resp) => resp.request().method() === "PATCH" && resp.url().includes("/events/"),
  222 |     { timeout: 12_000 }
  223 |   ).catch(() => null);
  224 | 
  225 |   // requestSubmit() déclenche l'événement submit + respecte noValidate (pas de validation native)
  226 |   await dialog.locator("form").evaluate((f) => f.requestSubmit());
  227 | 
  228 |   const patchResp = await patchPromise;
  229 |   if (patchResp) {
  230 |     const body = await patchResp.text().catch(() => "");
  231 |     expect(patchResp.status(), `PATCH failed (${patchResp.status()}): ${body}`).toBe(200);
  232 |   } else {
> 233 |     throw new Error("Aucune requête PATCH /events/:id — la soumission du formulaire n'a pas été déclenchée");
      |           ^ Error: Aucune requête PATCH /events/:id — la soumission du formulaire n'a pas été déclenchée
  234 |   }
  235 | 
  236 |   // Le dialog se ferme uniquement sur succès (onClose appelé après toast.success)
  237 |   await expect(dialog).toHaveCount(0, { timeout: 10_000 });
  238 | 
  239 |   // Nouveau titre visible dans la liste (preuve que React Query a invalidé)
  240 |   await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 12_000 });
  241 | 
  242 |   createdEventTitle = updatedTitle;
  243 | });
  244 | 
  245 | // ══════════════════════════════════════════════════════════════════════════════
  246 | // T5 — Déconnexion et protection de la route /dashboard
  247 | // ══════════════════════════════════════════════════════════════════════════════
  248 | test("T5 — Déconnexion et protection de la route /dashboard", async ({ page }) => {
  249 |   // setTokenOnce (evaluate) plutôt que injectToken (addInitScript).
  250 |   // addInitScript réinjecte le token après la navigation déclenchée par logout,
  251 |   // ce qui ferait échouer la vérification "token supprimé".
  252 |   await page.goto("/");
  253 |   await setTokenOnce(page, creatorToken);
  254 |   await page.goto("/dashboard");
  255 | 
  256 |   // Sidebar visible
  257 |   const sidebar = page.locator("aside").first();
  258 |   await expect(sidebar).toBeVisible({ timeout: 10_000 });
  259 | 
  260 |   // Cliquer "Se déconnecter"
  261 |   await sidebar.getByText("Se déconnecter").click();
  262 | 
  263 |   // Retour à la home après déconnexion
  264 |   await page.waitForURL("http://localhost:5173/", { timeout: 10_000 });
  265 | 
  266 |   // Token supprimé du localStorage
  267 |   const token = await page.evaluate(() =>
  268 |     window.localStorage.getItem("eventflow_creator_token")
  269 |   );
  270 |   expect(token).toBeNull();
  271 | 
  272 |   // Tentative d'accès direct au dashboard → redirect vers /submit-event
  273 |   await page.goto("/dashboard");
  274 |   await page.waitForURL(/\/submit-event/, { timeout: 10_000 });
  275 |   await expect(page.getByText("Votre compte organisateur")).toBeVisible({ timeout: 5_000 });
  276 | });
  277 | 
```