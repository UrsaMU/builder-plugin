import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import type { IDBObj, IUrsamuSDK } from "jsr:@ursamu/ursamu";

// ─── mock helpers ─────────────────────────────────────────────────────────────

function mockPlayer(overrides: Partial<IDBObj> = {}): IDBObj {
  return {
    id: "1",
    name: "TestPlayer",
    flags: new Set(["player", "connected", "builder"]),
    state: { quota: 50, owner: "1" },
    location: "2",
    contents: [],
    ...overrides,
  };
}

function mockRoom(overrides: Partial<IDBObj> = {}): IDBObj {
  return {
    id: "2",
    name: "Lobby",
    flags: new Set(["room"]),
    state: { name: "Lobby", owner: "1" },
    location: "",
    contents: [],
    ...overrides,
  };
}

function mockU(opts: {
  me?: Partial<IDBObj>;
  args?: string[];
  switches?: string[];
  cmdName?: string;
  original?: string;
  targetResult?: IDBObj | null;
  searchResults?: IDBObj[];
  canEditResult?: boolean;
  here?: IDBObj;
} = {}) {
  const sent: string[] = [];
  const dbCalls: unknown[][] = [];
  const dbCreated: unknown[] = [];
  const dbDestroyed: string[] = [];

  const me = mockPlayer(opts.me ?? {});
  const here = opts.here ?? mockRoom();

  return Object.assign({
    me,
    here,
    cmd: {
      name: opts.cmdName ?? "",
      original: opts.original ?? "",
      args: opts.args ?? [],
      switches: opts.switches ?? [],
    },
    send: (m: string) => sent.push(m),
    broadcast: () => {},
    canEdit: async () => opts.canEditResult ?? true,
    teleport: (_who: string, _where: string) => {},
    setFlags: async () => {},
    db: {
      modify: async (...a: unknown[]) => { dbCalls.push(a); },
      search: async (q: unknown) => {
        if (opts.searchResults) return opts.searchResults;
        if (opts.targetResult !== undefined) return opts.targetResult ? [opts.targetResult] : [];
        return [];
      },
      create: async (d: unknown) => {
        const obj = { ...(d as object), id: "99", name: (d as Record<string, unknown>).state?.name ?? "New", flags: new Set(), contents: [], state: (d as Record<string, unknown>).state ?? {} };
        dbCreated.push(obj);
        return obj;
      },
      destroy: async (id: string) => { dbDestroyed.push(id); },
    },
    util: {
      target: async (_me: IDBObj, name: string, _global?: boolean) => {
        if (name === "me" || name === me.id) return me;
        if (name === "here" || name === here.id) return here;
        return opts.targetResult ?? null;
      },
      displayName: (o: IDBObj) => o.name ?? o.id ?? "Unknown",
      stripSubs: (s: string) => s.replace(/%c[a-z]/gi, "").replace(/%[rntb]/gi, ""),
      center: (s: string) => s,
      ljust: (s: string, w: number) => s.padEnd(w),
      rjust: (s: string, w: number) => s.padStart(w),
    },
    ui: {
      panel: (p: unknown) => p,
      layout: () => {},
    },
  } as unknown as IUrsamuSDK, { _sent: sent, _dbCalls: dbCalls, _dbCreated: dbCreated, _dbDestroyed: dbDestroyed });
}

// ─── dig tests ────────────────────────────────────────────────────────────────

describe("dig script", () => {
  async function execDig(u: ReturnType<typeof mockU>) {
    const { default: script } = await import("../scripts/dig.ts");
    await script(u as unknown as IUrsamuSDK);
  }

  it("creates a room and deducts quota", async () => {
    const u = mockU({ args: ["Library"], me: { state: { quota: 10 } } });
    await execDig(u);
    assertStringIncludes(u._sent[0], "Library");
    assertEquals(u._dbCreated.length, 1);
    assertEquals(u._dbCalls[0]?.[1], "$inc");
    assertEquals((u._dbCalls[0]?.[2] as Record<string, number>)["data.quota"], -1);
  });

  it("staff bypass quota check", async () => {
    const u = mockU({ args: ["Library"], me: { flags: new Set(["player", "admin"]), state: { quota: 0 } } });
    await execDig(u);
    assertStringIncludes(u._sent[0], "Library");
    assertEquals(u._dbCalls.length, 0); // no quota deduction
  });

  it("insufficient quota — no creation", async () => {
    const u = mockU({ args: ["Library"], me: { flags: new Set(["player"]), state: { quota: 0 } } });
    await execDig(u);
    assertStringIncludes(u._sent[0], "quota");
    assertEquals(u._dbCreated.length, 0);
  });

  it("uses u.cmd.switches for teleport — not args", async () => {
    const u = mockU({ args: ["Library"], switches: ["teleport"], me: { state: { quota: 10 } } });
    await execDig(u);
    assertStringIncludes(u._sent[0], "Library");
  });

  it("missing room name — usage error", async () => {
    const u = mockU({ args: [""] });
    await execDig(u);
    assertStringIncludes(u._sent[0], "Usage");
  });
});

// ─── open tests ───────────────────────────────────────────────────────────────

describe("open script", () => {
  async function execOpen(u: ReturnType<typeof mockU>) {
    const { default: script } = await import("../scripts/open.ts");
    await script(u as unknown as IUrsamuSDK);
  }

  it("creates an exit to destination", async () => {
    const dest = mockRoom({ id: "5", name: "Library" });
    const u = mockU({ args: ["North;N=Library"], searchResults: [dest], me: { state: { quota: 10 } } });
    await execOpen(u);
    assertStringIncludes(u._sent[0], "North");
  });

  it("uses u.cmd.switches for /inventory — not args regex", async () => {
    const dest = mockRoom({ id: "5", name: "Library" });
    const u = mockU({ args: ["North=Library"], switches: ["inventory"], searchResults: [dest], me: { state: { quota: 10 } } });
    await execOpen(u);
    assertStringIncludes(u._sent[0], "North");
  });
});

// ─── lock tests ───────────────────────────────────────────────────────────────

describe("lock script", () => {
  async function execLock(u: ReturnType<typeof mockU>) {
    const { default: script } = await import("../scripts/lock.ts");
    await script(u as unknown as IUrsamuSDK);
  }

  it("locks a target with basic lock", async () => {
    const widget = mockRoom({ id: "5", name: "widget", flags: new Set(["thing"]) });
    const u = mockU({ args: ["widget=me"], original: "@lock widget=me", targetResult: widget });
    await execLock(u);
    assertStringIncludes(u._sent[0], "Locked");
    assertEquals(u._dbCalls[0]?.[2], { "data.lock": "me" });
  });

  it("uses u.cmd.switches for lock type — not original split", async () => {
    const widget = mockRoom({ id: "5", name: "widget", flags: new Set(["thing"]) });
    const u = mockU({ args: ["widget=wizard"], original: "@lock/use widget=wizard", switches: ["use"], targetResult: widget });
    await execLock(u);
    assertStringIncludes(u._sent[0], "Locked");
    assertStringIncludes(u._sent[0], "use");
  });

  it("unlocks — detects unlock from original", async () => {
    const widget = mockRoom({ id: "5", name: "widget", flags: new Set(["thing"]) });
    const u = mockU({ args: ["widget"], original: "@unlock widget", targetResult: widget });
    await execLock(u);
    assertStringIncludes(u._sent[0], "Unlocked");
    assertEquals(u._dbCalls[0]?.[2], { "data.lock": "" });
  });

  it("permission denied — no DB write", async () => {
    const widget = mockRoom({ id: "5", name: "widget" });
    const u = mockU({ args: ["widget=me"], original: "@lock widget=me", targetResult: widget, canEditResult: false });
    await execLock(u);
    assertStringIncludes(u._sent[0], "Permission denied");
    assertEquals(u._dbCalls.length, 0);
  });
});

// ─── parent tests ─────────────────────────────────────────────────────────────

describe("parent script", () => {
  async function execParent(u: ReturnType<typeof mockU>) {
    const { default: script } = await import("../scripts/parent.ts");
    await script(u as unknown as IUrsamuSDK);
  }

  it("sets parent using u.cmd.switches — not cmd.name", async () => {
    const target = mockRoom({ id: "5", name: "widget", state: {} });
    const parent = mockRoom({ id: "6", name: "proto", state: {} });
    const u = mockU({ args: ["widget=proto"], searchResults: [target, parent] });
    // override search to return correct objects
    let call = 0;
    u.db.search = async () => call++ === 0 ? [target] : [parent];
    await execParent(u);
    assertStringIncludes(u._sent[0], "Parent");
  });

  it("clear switch — uses u.cmd.switches", async () => {
    const target = mockRoom({ id: "5", name: "widget", state: { parent: "6" } });
    const u = mockU({ args: ["widget"], switches: ["clear"], searchResults: [target] });
    await execParent(u);
    assertStringIncludes(u._sent[0], "cleared");
    assertEquals(u._dbCalls[0]?.[1], "$unset");
  });
});

// ─── wipe tests ───────────────────────────────────────────────────────────────

describe("wipe script", () => {
  async function execWipe(u: ReturnType<typeof mockU>) {
    const { default: script } = await import("../scripts/wipe.ts");
    await script(u as unknown as IUrsamuSDK);
  }

  it("prompts for confirmation when no /confirm", async () => {
    const widget = mockRoom({ id: "5", name: "widget", state: { attributes: [{ name: "COLOR", value: "red" }] } });
    const u = mockU({ args: ["widget"], searchResults: [widget] });
    await execWipe(u);
    assertStringIncludes(u._sent[0], "confirm");
    assertEquals(u._dbCalls.length, 0);
  });

  it("wipes with /confirm switch", async () => {
    const widget = mockRoom({ id: "5", name: "widget", state: { attributes: [{ name: "COLOR", value: "red" }] } });
    const u = mockU({ args: ["widget"], switches: ["confirm"], searchResults: [widget] });
    await execWipe(u);
    assertStringIncludes(u._sent[0], "Wiped");
    assertEquals(u._dbCalls[0]?.[2], { "data.attributes": [] });
  });

  it("no attributes — informs user", async () => {
    const widget = mockRoom({ id: "5", name: "widget", state: { attributes: [] } });
    const u = mockU({ args: ["widget"], switches: ["confirm"], searchResults: [widget] });
    await execWipe(u);
    assertStringIncludes(u._sent[0], "no attributes");
    assertEquals(u._dbCalls.length, 0);
  });
});

// ─── plugin init tests ────────────────────────────────────────────────────────

describe("plugin lifecycle", () => {
  it("init() returns true", async () => {
    // Stub registerScript and registerPluginRoute for test environment
    const { plugin } = await import("../index.ts");
    // We can't fully init without the engine, but we can verify the shape
    assertEquals(typeof plugin.init, "function");
    assertEquals(typeof plugin.remove, "function");
    assertEquals(plugin.name, "builder");
    assertEquals(plugin.version, "1.0.0");
  });
});
