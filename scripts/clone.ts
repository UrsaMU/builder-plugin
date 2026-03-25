import type { IUrsamuSDK } from "jsr:@ursamu/ursamu";

/**
 * @clone <obj>=<new name>
 *
 * Creates a copy of an object in your inventory. Copies flags, description,
 * and attributes. Cannot clone players or rooms.
 *
 * Examples:
 *   @clone widget=My Widget Copy
 *   @clone #42=Backup Sword
 */
export default async (u: IUrsamuSDK) => {
  const actor    = u.me;
  const fullArgs = (u.cmd.args[0] || "").trim();

  const eqIdx  = fullArgs.indexOf("=");
  const objName = eqIdx >= 0 ? fullArgs.slice(0, eqIdx).trim() : fullArgs;
  const newName = eqIdx >= 0 ? fullArgs.slice(eqIdx + 1).trim() : "";

  if (!objName) {
    u.send("Usage: @clone <obj>=<new name>");
    return;
  }
  if (newName && newName.length > 200) {
    u.send("Name too long (max 200 characters).");
    return;
  }

  const results = await u.db.search(objName);
  const obj     = results[0];
  if (!obj) { u.send("I can't see that here."); return; }

  if (obj.flags.has("player")) { u.send("You can't clone players."); return; }
  if (obj.flags.has("room"))   { u.send("You can't clone rooms."); return; }

  if (!(await u.canEdit(actor, obj))) { u.send("Permission denied."); return; }

  const isStaff = actor.flags.has("wizard") || actor.flags.has("admin") || actor.flags.has("superuser");
  const quota   = (actor.state.quota as number) ?? 0;
  if (!isStaff && quota < 1) {
    u.send("You don't have enough quota to clone.");
    return;
  }

  let clone;
  try {
    clone = await u.db.create({
      flags: obj.flags,
      location: actor.id,
      state: {
        name:        newName || (obj.state.name as string) || "Cloned Object",
        description: obj.state.description || "",
        owner:       actor.id,
        attributes:  obj.state.attributes || [],
      },
    });
  } catch (err: unknown) {
    u.send(`Clone failed: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  if (!isStaff) {
    await u.db.modify(actor.id, "$inc", { "data.quota": -1 });
  }

  u.send(`Cloned: %ch${obj.name || obj.id}%cn(#${obj.id}) → %ch${clone.state.name as string}%cn(#${clone.id})`);
};
