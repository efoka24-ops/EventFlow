import { beforeEach, describe, expect, it, vi } from "vitest";

const EVENTS_URL = "https://jsonblob.com/api/jsonBlob/019d9725-a658-795a-9147-e17fd51f5207";
const REGS_URL = "https://jsonblob.com/api/jsonBlob/019d9725-aa52-7c74-9281-2ce60fe6471f";

describe("base44Client shared storage", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  it("shares newly created event across simulated devices", async () => {
    let remoteEvents = [];
    let remoteRegs = [];

    global.fetch = vi.fn(async (url, options = {}) => {
      const method = (options.method || "GET").toUpperCase();

      if (url === EVENTS_URL) {
        if (method === "GET") {
          return new Response(JSON.stringify(remoteEvents), { status: 200 });
        }
        if (method === "PUT") {
          remoteEvents = JSON.parse(options.body || "[]");
          return new Response(JSON.stringify(remoteEvents), { status: 200 });
        }
      }

      if (url === REGS_URL) {
        if (method === "GET") {
          return new Response(JSON.stringify(remoteRegs), { status: 200 });
        }
        if (method === "PUT") {
          remoteRegs = JSON.parse(options.body || "[]");
          return new Response(JSON.stringify(remoteRegs), { status: 200 });
        }
      }

      return new Response("Not found", { status: 404 });
    });

    const { base44 } = await import("../src/api/base44Client.js");

    const created = await base44.entities.Event.create({
      title: "Event cross-device",
      category: "conference",
      status: "publie",
    });

    // Simulate another device/browser with empty local cache.
    window.localStorage.clear();

    const listed = await base44.entities.Event.list("-created_date");
    expect(listed.some((event) => event.id === created.id)).toBe(true);
  });

  it("falls back to local storage when remote service is unavailable", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    });

    const { base44 } = await import("../src/api/base44Client.js");
    const created = await base44.entities.Event.create({
      title: "Local fallback event",
      category: "conference",
      status: "publie",
    });

    const listed = await base44.entities.Event.list();
    expect(listed.some((event) => event.id === created.id)).toBe(true);
  });
});
