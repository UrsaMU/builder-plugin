/**
 * UrsaMU Builder Plugin
 *
 * Provides world-building commands (@dig, @open, @link, @unlink, @clone,
 * @destroy, @describe, @examine, @name, @set, &ATTR, @lock, @parent,
 * @quota, @wipe) and a REST API for programmatic world building.
 *
 * @module builder-plugin
 */

import { registerScript, registerPluginRoute, gameHooks } from "jsr:@ursamu/ursamu";
import type { IPlugin, SessionEvent } from "jsr:@ursamu/ursamu";
import { buildingRouteHandler } from "./routes.ts";

// ─── script names bundled by this plugin ──────────────────────────────────────

const SCRIPTS = [
  "dig", "open", "link", "unlink", "clone", "destroy",
  "describe", "examine", "name", "set", "setAttr",
  "lock", "quota", "parent", "wipe", "oemit",
] as const;

// ─── load script content at init time ─────────────────────────────────────────

async function loadScript(name: string): Promise<string | null> {
  const base = new URL(`scripts/${name}.ts`, import.meta.url);
  try {
    if (base.protocol === "file:") {
      const { fromFileUrl } = await import("jsr:@std/path");
      return await Deno.readTextFile(fromFileUrl(base));
    }
    const res = await fetch(base.toString());
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

// ─── lifecycle hook handlers ───────────────────────────────────────────────────

const onLogin = (_e: SessionEvent) => {
  // Reserved for future: welcome new builders on login
};

// ─── plugin ───────────────────────────────────────────────────────────────────

export const plugin: IPlugin = {
  name:        "builder",
  version:     "1.1.0",
  description: "World-building commands and REST API — @dig, @open, @link, @describe, @examine, @oemit, and more.",

  init: async () => {
    // Register all builder scripts — they override engine bundled copies
    for (const name of SCRIPTS) {
      const content = await loadScript(name);
      if (content) {
        registerScript(name, content);
      } else {
        console.warn(`[builder-plugin] Could not load script: ${name}`);
      }
    }

    // Mount REST API
    registerPluginRoute("/api/v1/building", buildingRouteHandler);

    // Wire lifecycle hooks
    gameHooks.on("player:login", onLogin);

    console.log("[builder-plugin] Loaded — 16 scripts + REST API at /api/v1/building");
    return true;
  },

  remove: () => {
    gameHooks.off("player:login", onLogin);
    // Note: REST route /api/v1/building and registered scripts persist until restart
  },
};

export default plugin;
