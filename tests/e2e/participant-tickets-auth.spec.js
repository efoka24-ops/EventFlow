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
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Mes billets" })).toHaveCount(0);

  await page.goto("/participant/tickets");
  await expect(page.getByText("Connexion requise")).toBeVisible();

  const token = createUnsignedJwt({
    sub: "creator-e2e",
    role: "creator",
    email: "creator.demo@eventflow.local",
    phone: "+237690000001",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  await page.context().addInitScript((jwt) => {
    window.localStorage.setItem("eventflow_creator_token", jwt);
  }, token);

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Mes billets" })).toBeVisible();
});
