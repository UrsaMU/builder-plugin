import type { IUrsamuSDK } from "jsr:@ursamu/ursamu";

/**
 * @wipe[/confirm] <object>
 *
 * Removes all user-set attributes from an object. Requires /confirm.
 *
 * Switches:
 *   /confirm  Required to actually wipe — prevents accidental data loss.
 *
 * Examples:
 *   @wipe widget              — prompts for confirmation
 *   @wipe/confirm widget      — wipes all attributes
 */
export default async (u: IUrsamuSDK) => {
  const arg     = (u.cmd.args[0] || "").trim();
  const confirm = (u.cmd.switches?.[0] || "").toLowerCase() === "confirm";

  if (!arg) {
    u.send("Usage: @wipe[/confirm] <object>");
    return;
  }

  const results = await u.db.search(arg);
  const target  = results[0];
  if (!target) { u.send(`I can't find '${arg}'.`); return; }
  if (!(await u.canEdit(u.me, target))) { u.send("Permission denied."); return; }

  const attrs = (target.state.attributes as unknown[]) || [];
  if (attrs.length === 0) {
    u.send(`${u.util.displayName(target, u.me)} has no attributes to wipe.`);
    return;
  }

  if (!confirm) {
    u.send(`This will wipe %ch${attrs.length}%cn attribute${attrs.length === 1 ? "" : "s"} from ${u.util.displayName(target, u.me)}.`);
    u.send(`Use %ch@wipe/confirm ${arg}%cn to confirm.`);
    return;
  }

  await u.db.modify(target.id, "$set", { "data.attributes": [] });
  u.send(`Wiped ${attrs.length} attribute${attrs.length === 1 ? "" : "s"} from ${u.util.displayName(target, u.me)}.`);
};
