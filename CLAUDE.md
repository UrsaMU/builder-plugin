# builder-plugin — Claude Code Instructions

## Project identity

External plugin for **UrsaMU**. Provides world-building commands (`@dig`,
`@open`, `@link`, `@unlink`, `@clone`, `@destroy`, `@describe`, `@examine`,
`@name`, `@set`, `&ATTR`, `@lock`, `@parent`, `@quota`, `@wipe`, `@zone`,
`@oemit`, `@batchbuild`) plus a REST API mounted at `/api/v1/building`.

- Engine repo: `https://github.com/UrsaMU/ursamu`
- Engine conventions: `https://github.com/UrsaMU/ursamu/blob/main/CLAUDE.md`
- This plugin targets ursamu `^2.3.0`.

Scripts in `scripts/` are **sandbox scripts** — they're loaded at plugin init
via `registerScript()` and run inside the LocalSandbox Web Worker, not Deno.
Native commands (filesystem access, e.g. `@batchbuild`) live in `batchbuild.ts`
and register through `addCmd` from the host process.

---

## Commands

```bash
deno check --unstable-kv mod.ts                       # type check
deno lint                                             # lint
deno test --allow-all --unstable-kv --no-check        # unit tests
```

## Pre-commit checklist (all must pass before every commit)

```bash
deno check --unstable-kv mod.ts
deno lint
deno test --allow-all --unstable-kv --no-check
```

---

## Repo layout

```
index.ts          Plugin definition — init() registers scripts + routes
mod.ts            Public export
routes.ts         Express REST handler for /api/v1/building
batchbuild.ts     Native addCmd command (filesystem-bound)
scripts/<name>.ts Sandbox scripts — one file per command, no Deno/fetch/fs
help/             Markdown help files served by ursamu-help-plugin
tests/            Deno test files — mock SDK, no live KV
```

---

## Imports — always use the JSR package

```typescript
import { addCmd, registerScript, registerPluginRoute, gameHooks } from "jsr:@ursamu/ursamu";
import type { ICmd, IPlugin, IDBObj, IUrsamuSDK, SessionEvent, FormatSlot } from "jsr:@ursamu/ursamu";

// Format helpers (v2.3.0+)
import {
  resolveFormat, resolveFormatOr,
  registerFormatHandler, unregisterFormatHandler,
  header, divider, footer,
} from "jsr:@ursamu/ursamu";
```

Never use relative imports across plugins. Never pin to `https://` URLs.

---

## Plugin architecture (three phases — non-negotiable)

```
Phase 1 — module load   import "./batchbuild.ts" → addCmd() fires at load time
Phase 2 — init()        registerScript(), registerPluginRoute(), gameHooks.on() → return true
Phase 3 — remove()      gameHooks.off() for every .on() using the SAME named function reference
```

```typescript
const onLogin = (e: SessionEvent) => { /* ... */ };  // named ref — required for remove()

export const plugin: IPlugin = {
  name: "builder",
  version: "1.3.0",
  description: "World-building plugin.",
  init: async () => {
    for (const name of SCRIPTS) registerScript(name, await loadScript(name));
    registerPluginRoute("/api/v1/building", buildingRouteHandler);
    gameHooks.on("player:login", onLogin);
    return true;
  },
  remove: () => { gameHooks.off("player:login", onLogin); },
};
```

**DBO namespace rule**: any DBO collection created by this plugin must be
prefixed `builder.`:

```typescript
const records = new DBO<IRecord>("builder.records");  // correct
const records = new DBO<IRecord>("records");          // wrong — collides
```

---

## addCmd skeleton (native commands only — for sandbox scripts see below)

```typescript
addCmd({
  name: "@example",
  pattern: /^@example(?:\/(\S+))?\s*(.*)/i,
  lock: "connected builder+",
  category: "Building",
  help: `@example[/<switch>] <required>  — Brief description.

Switches:
  /switch   What this switch does.

Examples:
  @example foo`,
  exec: async (u: IUrsamuSDK) => {
    const sw  = (u.cmd.args[0] ?? "").toLowerCase().trim();
    const arg = u.util.stripSubs(u.cmd.args[1] ?? "").trim();
    // ...
  },
});
```

### Sandbox-script skeleton (scripts/*.ts)

```typescript
import type { IUrsamuSDK } from "jsr:@ursamu/ursamu";

export const aliases = ["alt"];        // optional command aliases

export default async (u: IUrsamuSDK) => {
  // No Deno.*, no fetch, no fs, no relative imports.
  // Use only what the SDK exposes via the sandbox bridge.
};
```

### Pattern cheat-sheet

| Intent | Pattern | args |
|--------|---------|------|
| No args | `/^@cmd$/i` | — |
| One arg | `/^@cmd\s+(.*)/i` | `[0]` |
| Switch + arg | `/^@cmd(?:\/(\S+))?\s*(.*)/i` | `[0]`=sw, `[1]`=rest |
| Two parts (=) | `/^@cmd\s+(.+)=(.+)/i` | `[0]`, `[1]` |

### Catch-all switch pattern — critical gotcha

A catch-all pattern `/^@cmd(?:\/(\S+))?\s*(.*)/i` consumes `@cmd/anything`
before any more-specific `addCmd` for the same prefix gets a chance. Handle
sub-commands as switch branches inside one exec, not as separate registrations
under the same root.

### Lock levels

| String | Who can use it |
|--------|----------------|
| `""` | Login screen (unauthenticated) |
| `"connected"` | Any logged-in player |
| `"connected builder+"` | Builder flag or higher |
| `"connected admin+"` | Admin flag or higher |
| `"connected wizard"` | Wizard only |

### Lockfunc system (v2.2.0+)

Lock strings support callable funcs `func(arg1, arg2)` combined with `&&`,
`||`, `!`, `()`. Built-ins: `flag`, `attr`, `type`, `is`, `holds`, `perm`.
Custom lockfuncs register via `registerLockFunc(name, fn)` from `init()`.
Fail-closed: unknown func / error → false. Max 4096 chars / 256 tokens.

```typescript
import { registerLockFunc } from "jsr:@ursamu/ursamu";

registerLockFunc("tribe", (enactor, _t, args) =>
  String(enactor.state.tribe ?? "").toLowerCase() === args[0]?.toLowerCase()
);
// lock: "connected && tribe(glasswaler)"
```

---

## Format-attribute system (v2.3.0+)

ursamu exposes hooks that let attributes on a target override how commands
render output. The engine resolves slots in priority order:

1. Softcode attribute on the target (e.g. `@nameformat`, `@descformat`,
   `@examineformat`) — evaluated through the TinyMUX softcode engine,
   `%0` = default rendered string.
2. Plugin-registered handler for the slot.
3. Built-in default rendering.

**Built-in slots** (`FormatSlot` literal union): `NAMEFORMAT`, `DESCFORMAT`,
`CONFORMAT`, `EXITFORMAT`, `WHOFORMAT`, `WHOROWFORMAT`, `PSFORMAT`,
`PSROWFORMAT`.

**Native-command pattern** (`resolveFormat` is available at host level):

```typescript
import { resolveFormat, type FormatSlot } from "jsr:@ursamu/ursamu";

const defaultBlock = renderDefault(target);
const override = await resolveFormat(u, target, "EXAMINEFORMAT" as FormatSlot, defaultBlock);
u.send(override ?? defaultBlock);
```

**Sandbox-script pattern** (`resolveFormat` not exposed in the worker — use
`u.attr.get` + `u.eval` directly):

```typescript
const raw = await u.attr?.get?.(target.id, "EXAMINEFORMAT");
if (raw != null && String(raw).trim() !== "") {
  try {
    const evaluated = await u.eval?.(target.id, "EXAMINEFORMAT", [defaultBlock]);
    if (evaluated != null && String(evaluated) !== "") return u.send(String(evaluated));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[builder-plugin <cmd>] eval failed on #${target.id}: ${msg}`);
  }
}
u.send(defaultBlock);
```

Adding a new slot from a plugin: pass any uppercase string and cast to
`FormatSlot`. The runtime only requires a string attribute name; the TS union
is an in-engine guard.

---

## Key SDK idioms

```typescript
// Target resolution — always guard null
const target = await u.util.target(u.me, rawName, true); // true = global search
if (!target) { u.send("Not found."); return; }

// Display name (applies monikers)
u.util.displayName(target, u.me);

// Strip MUSH codes BEFORE DB ops or length checks (always)
const clean = u.util.stripSubs(u.cmd.args[0]).trim();

// DB writes — op must be "$set" | "$inc" | "$unset" only
await u.db.modify(target.id, "$set",  { "data.gold": 100 });
await u.db.modify(target.id, "$inc",  { "data.score": 1 });
await u.db.modify(target.id, "$unset",{ "data.tempFlag": "" });

// Permission check (Promise<boolean>)
if (!(await u.canEdit(u.me, target))) { u.send("Permission denied."); return; }

// Admin check
const isStaff = u.me.flags.has("admin") || u.me.flags.has("wizard") || u.me.flags.has("superuser");

// Send to another player
u.send("Message for target.", target.id);
```

---

## MUSH color codes

| Code | Effect | Code | Effect |
|------|--------|------|--------|
| `%ch` | Bold | `%cn` | Reset (always close with this) |
| `%cr` | Red | `%cg` | Green |
| `%cb` | Blue | `%cy` | Yellow |
| `%cw` | White | `%cc` | Cyan |
| `%r`  | Newline | `%t` | Tab |

Use `u.util.center(title, 78, "=")` for section headers.

---

## Help file standards (non-negotiable)

Help files live in `help/*.md` and are served in-game by the
ursamu-help-plugin FileProvider when present.

### Width and length

- **Max line width: 78 characters.** Every line — headers, body, examples.
- **Max page length: 22 lines of content** (one 24-line terminal, prompt room).
  Split longer topics into a subdirectory named after the topic; the overview
  file ends with `SEE ALSO: +help topic/sub, ...` and each sub-file opens with
  `See also: +help topic (overview)`.

### File format

```
+TOPIC-NAME

One-sentence description; use `value` for examples.

SYNTAX
  +command[/switch] <required> [<optional>]

SWITCHES
  /switch    What this switch does.

EXAMPLES
  +command foo       Does the thing.

SEE ALSO: +help related-topic
```

- Title `+TOPIC-NAME` ALL CAPS, flush left — no decorative borders.
- Section labels ALL CAPS, flush left.
- Body indented 2 spaces. 1 blank line between sections.
- Markdown: `**bold**` for key terms, `` `backtick` `` for values. No italics,
  no headings inside body, no HTML, no tables.

---

## Test patterns

### Required boilerplate

```typescript
import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals, assertStringIncludes } from "jsr:@std/assert";
import type { IDBObj, IUrsamuSDK } from "jsr:@ursamu/ursamu";

// When importing service layer (rare in plugin tests):
const OPTS = { sanitizeResources: false, sanitizeOps: false };
```

### mockPlayer / mockU helpers

Define at the top of each test file. Prefix test IDs (e.g. `"ef_actor"`,
`"ef_room"`) to avoid collisions across test files.

Plugin tests don't run the full sandbox — they import each `scripts/<name>.ts`
default export directly and feed it a mock `IUrsamuSDK`. Mock `u.attr`,
`u.eval`, `u.ui` only when the script under test uses them.

### Required test cases for every script

- Happy path — correct output and DB call
- Null target — graceful not-found message, no DB write
- Permission denied — `canEdit` false, no DB write
- DB op is `$set`/`$inc`/`$unset` (assert exact args)
- Admin guard — non-admin rejected (if admin command)
- `stripSubs` called before DB (MUSH codes stripped)

---

## Sandbox-script constraints

Scripts in `scripts/` run inside the Web Worker sandbox. Rules:
- No `Deno.*`, no `fetch`, no `import` from anywhere
- ESM-style preferred: `export default async (u) => { ... }`
- `export const aliases = ["alt"]` for command aliases
- Use only the SDK surface exposed by the sandbox bridge
- `u.util.stripSubs(str)` to strip `%cX`, `%n/%r/%t/%b/%R`, raw ANSI escapes
- `u.eval(targetIdOrName, attrName, args)` evaluates a softcode attribute

---

## Code style (non-negotiable)

- **Early return** over nested conditions
- **No function longer than 50 lines** — decompose
- **No file longer than 200 lines** — split
- **No bare `catch`** — always `catch (e: unknown)`
- **Library-first** — if the SDK does it, use the SDK
- **No deep nesting** — max 3 levels
- **No comments** unless the WHY is non-obvious

---

## Audit checklist (run mentally before every PR)

- [ ] `u.util.stripSubs()` on all user strings before DB ops or length checks
- [ ] `await u.canEdit(u.me, target)` before modifying any object not owned by `u.me`
- [ ] All DB writes use `"$set"` / `"$inc"` / `"$unset"` — never raw object overwrite
- [ ] `u.util.target()` result null-checked before use
- [ ] Admin-only actions check `u.me.flags` explicitly
- [ ] Sandbox scripts use no Deno APIs, no `fetch`, no non-`u` globals
- [ ] All `%c*` color codes closed with `%cn`
- [ ] Every `addCmd` has `help:` with syntax + Switches (if any) + ≥2 examples
- [ ] `gameHooks.on()` in `init()` paired with `gameHooks.off()` in `remove()` — same named reference
- [ ] DBO collection names prefixed with `builder.`
- [ ] REST route handlers return 401 before any work when `userId` is null
- [ ] `init()` returns `true`
- [ ] Custom lockfuncs registered via `registerLockFunc` — never overwrite built-in names
- [ ] Every help file ≤ 22 content lines and ≤ 78 cols
- [ ] Multi-page topics linked with `SEE ALSO:` and back-references

---

## PRs and commits

- No Claude/AI attribution in PR titles, commit messages, or code comments.
- Squash-merge for feature PRs.
- Tag versions after merge: `git tag v<version> && git push --tags`.
