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

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = async () => {
  const ts = Date.now();

  const { response: adminLoginResp, body: adminLoginBody } = await json(`${BASE_URL}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert(adminLoginResp.ok, `Admin login failed (${adminLoginResp.status})`);
  const adminToken = adminLoginBody?.token;
  assert(adminToken, "Admin token missing");

  const { response: creatorLoginResp, body: creatorLoginBody } = await json(`${BASE_URL}/auth/creator/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "creator.demo@eventflow.local", password: "demo1234" }),
  });
  assert(creatorLoginResp.ok, `Creator login failed (${creatorLoginResp.status})`);
  const creatorToken = creatorLoginBody?.token;
  assert(creatorToken, "Creator token missing");

  const eventPayload = {
    title: `E2E Event ${ts}`,
    category: "technologie",
    date_start: new Date(Date.now() + 86400000).toISOString(),
    city: "Douala",
    status: "publie",
    submitted_by_user: true,
    organizer_name: "Demo Creator",
    organizer_email: "creator.demo@eventflow.local",
    price: 0,
  };

  const { response: createEventResp, body: createdEvent } = await json(`${BASE_URL}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creatorToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });
  assert(createEventResp.ok, `Create event failed (${createEventResp.status})`);

  const registrationPayload = {
    event_id: createdEvent.id,
    first_name: "Test",
    last_name: "User",
    email: "creator.demo@eventflow.local",
    phone: "+237690000099",
    gender: "autre",
    registration_method: "formulaire",
    status: "en_attente",
  };

  const { response: createRegistrationResp, body: createdRegistration } = await json(`${BASE_URL}/registrations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creatorToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registrationPayload),
  });
  assert(createRegistrationResp.ok, `Create registration failed (${createRegistrationResp.status})`);

  const { response: creatorListResp, body: creatorListBody } = await json(`${BASE_URL}/registrations?sort=-created_date`, {
    headers: { Authorization: `Bearer ${creatorToken}` },
  });
  assert(creatorListResp.ok, `Creator list registrations failed (${creatorListResp.status})`);
  const seesOwn = Array.isArray(creatorListBody) && creatorListBody.some((item) => item.id === createdRegistration.id);
  assert(seesOwn, "Creator cannot see own registration");

  const { response: adminPatchResp, body: adminPatchBody } = await json(`${BASE_URL}/registrations/${createdRegistration.id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "validee", validated_date: new Date().toISOString() }),
  });
  assert(adminPatchResp.ok, `Admin patch registration failed (${adminPatchResp.status})`);
  assert(adminPatchBody?.status === "validee", "Registration status not updated to validee");

  const { response: deleteEventResp } = await json(`${BASE_URL}/events/${createdEvent.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(deleteEventResp.ok, `Delete event failed (${deleteEventResp.status})`);

  console.log(
    JSON.stringify(
      {
        suite: "business-e2e",
        ok: true,
        metrics: {
          admin_login_status: adminLoginResp.status,
          creator_login_status: creatorLoginResp.status,
          create_event_status: createEventResp.status,
          create_registration_status: createRegistrationResp.status,
          list_registration_status: creatorListResp.status,
          update_registration_status: adminPatchResp.status,
          delete_event_status: deleteEventResp.status,
        },
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        suite: "business-e2e",
        ok: false,
        error: error.message,
      },
      null,
      2
    )
  );
  process.exit(1);
});
