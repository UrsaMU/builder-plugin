/**
 * @examineformat hook tests — mirrors ursamu's look_formats_integration.test.ts
 * pattern, using mock SDK (the plugin scripts run in the sandbox in production;
 * here we exercise the script directly with a mock `u.attr` + `u.eval`).
 */
import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import type { IDBObj, IUrsamuSDK } from "jsr:@ursamu/ursamu";

function mockPlayer(overrides: Partial<IDBObj> = {}): IDBObj {
  return {
    id: "ef_actor",
    name: "Examiner",
    flags: new Set(["player", "connected", "wizard"]),
    state: { name: "Examiner" },
    location: "ef_room",
    contents: [],
    ...overrides,
  };
}

function mockRoom(overrides: Partial<IDBObj> = {}): IDBObj {
  return {
    id: "ef_room",
    name: "Test Room",
    flags: new Set(["room"]),
    state: { name: "Test Room", description: "A plain room." },
    location: "",
    contents: [],
    ...overrides,
  };
}

interface MockOpts {
  target?: IDBObj;
  attrs?: Record<string, string>;
  evalImpl?: (id: string, attr: string, args: string[]) => Promise<string>;
}

function mockU(opts: MockOpts = {}) {
  const sent: string[] = [];
  const me = mockPlayer();
  const here = opts.target ?? mockRoom();
  const attrStore = new Map<string, string>(
    Object.entries(opts.attrs ?? {}).map(([k, v]) => [k.toUpperCase(), v]),
  );

  const defaultEval = async (_id: string, attr: string, args: string[]) => {
    const raw = attrStore.get(attr.toUpperCase()) ?? "";
    // Naive %0 substitution to mimic softcode arg passing.
    return raw.replace(/%0/g, args[0] ?? "");
  };

  return Object.assign({
    me,
    here,
    cmd: { name: "examine", original: "@examine", args: [""], switches: [] },
    send: (m: string) => sent.push(m),
    broadcast: () => {},
    canEdit: async () => true,
    db: {
      modify: async () => {},
      search: async () => [],
      create: async () => ({ id: "x", flags: new Set(), contents: [] }),
      destroy: async () => {},
    },
    util: {
      target: async () => here,
      displayName: (o: IDBObj) => o.name ?? o.id ?? "Unknown",
      stripSubs: (s: string) => s.replace(/%c[a-z]/gi, "").replace(/%[rntb]/gi, ""),
      center: (s: string) => s,
      ljust: (s: string, w: number) => s.padEnd(w),
      rjust: (s: string, w: number) => s.padStart(w),
    },
    attr: {
      get: async (_id: string, name: string) => attrStore.get(name.toUpperCase()) ?? null,
      set: async () => {},
      clear: async () => true,
    },
    eval: opts.evalImpl ?? defaultEval,
    ui: { panel: (p: unknown) => p, layout: () => {} },
  } as unknown as IUrsamuSDK, { _sent: sent });
}

async function runExamine(u: ReturnType<typeof mockU>) {
  const { default: script } = await import("../scripts/examine.ts");
  await script(u as unknown as IUrsamuSDK);
}

describe("examine: EXAMINEFORMAT hook", () => {
  it("no @examineformat — default rendering used", async () => {
    const u = mockU();
    await runExamine(u);
    assertStringIncludes(u._sent[0], "Test Room");
    assertStringIncludes(u._sent[0], "Description:");
  });

  it("@examineformat with %0 fully replaces output", async () => {
    const u = mockU({ attrs: { EXAMINEFORMAT: ">>>BEGIN<<<\n%0\n>>>END<<<" } });
    await runExamine(u);
    assertStringIncludes(u._sent[0], ">>>BEGIN<<<");
    assertStringIncludes(u._sent[0], ">>>END<<<");
    // %0 was the default block — must still contain the target name
    assertStringIncludes(u._sent[0], "Test Room");
  });

  it("empty @examineformat — falls through to default", async () => {
    const u = mockU({ attrs: { EXAMINEFORMAT: "" } });
    await runExamine(u);
    // Default rendering still has Flags/Owner labels
    assertStringIncludes(u._sent[0], "Flags:");
    assertStringIncludes(u._sent[0], "Owner:");
  });

  it("eval throws — caught, falls back to default", async () => {
    const u = mockU({
      attrs: { EXAMINEFORMAT: "bad-softcode" },
      evalImpl: async () => { throw new Error("boom"); },
    });
    await runExamine(u);
    // Default still emitted
    assertStringIncludes(u._sent[0], "Test Room");
    assertStringIncludes(u._sent[0], "Description:");
  });

  it("eval returns empty string — falls back to default", async () => {
    const u = mockU({
      attrs: { EXAMINEFORMAT: "anything" },
      evalImpl: async () => "",
    });
    await runExamine(u);
    assertStringIncludes(u._sent[0], "Test Room");
    assertStringIncludes(u._sent[0], "Flags:");
  });
});
