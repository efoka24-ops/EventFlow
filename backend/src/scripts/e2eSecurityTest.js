import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001/api";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@eventflow.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "change_admin_password";

const json = async (url, init = {}) => {
  const response = await fetch(url, init);
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return { response, body };
};

const run = async () => {
  const results = [];

  const anonRegs = await json(`${BASE_URL}/registrations`);
  results.push({ test: "anon_access_registrations", expected: 401, actual: anonRegs.response.status, pass: anonRegs.response.status === 401 });

  const badAdmin = await json(`${BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: "wrong-password" }),
  });
  results.push({ test: "admin_wrong_password", expected: 401, actual: badAdmin.response.status, pass: badAdmin.response.status === 401 });

  const sqliAdmin = await json(`${BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@eventflow.com' OR '1'='1", password: "anything" }),
  });
  results.push({ test: "admin_sqli_payload", expected: "4xx", actual: sqliAdmin.response.status, pass: sqliAdmin.response.status >= 400 && sqliAdmin.response.status < 500 });

  const creatorLogin = await json(`${BASE_URL}/auth/creator/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "creator.demo@eventflow.local", password: "demo1234" }),
  });

  const creatorToken = creatorLogin.body?.token;

  const idorTry = await json(`${BASE_URL}/registrations?email=victim@example.com`, {
    headers: { Authorization: `Bearer ${creatorToken}` },
  });
  const idorSafe = Array.isArray(idorTry.body)
    ? idorTry.body.every((row) => String(row.email || "").toLowerCase() === "creator.demo@eventflow.local")
    : false;

  results.push({
    test: "idor_read_registrations_by_email_query",
    expected: true,
    actual: idorSafe,
    pass: idorTry.response.status === 200 && idorSafe,
  });

  const unrestrictedCreateEvent = await json(`${BASE_URL}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `SECURITY-E2E-${Date.now()}`,
      category: "technologie",
      date_start: new Date(Date.now() + 3600000).toISOString(),
      city: "Douala",
      status: "publie",
    }),
  });

  results.push({
    test: "anon_create_event_must_be_blocked",
    expected: 401,
    actual: unrestrictedCreateEvent.response.status,
    pass: unrestrictedCreateEvent.response.status === 401,
  });

  if (unrestrictedCreateEvent.response.ok && unrestrictedCreateEvent.body?.id) {
    const adminLogin = await json(`${BASE_URL}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const adminToken = adminLogin.body?.token;
    if (adminToken) {
      await json(`${BASE_URL}/events/${unrestrictedCreateEvent.body.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  }

  const passCount = results.filter((r) => r.pass).length;
  const ok = passCount === results.length;

  console.log(
    JSON.stringify(
      {
        suite: "security-e2e",
        ok,
        passCount,
        total: results.length,
        results,
      },
      null,
      2
    )
  );

  if (!ok) process.exit(1);
};

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        suite: "security-e2e",
        ok: false,
        error: error.message,
      },
      null,
      2
    )
  );
  process.exit(1);
});
