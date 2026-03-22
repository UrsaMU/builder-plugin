import type { IUrsamuSDK } from "jsr:@ursamu/ursamu";

/**
 * @destroy[/confirm][/override] <target>
 *
 * Destroys an object. Requires /confirm to proceed. Orphaned exits that
 * led to or from the destroyed object are automatically cleaned up.
 *
 * Switches:
 *   /confirm   Required to actually destroy — prevents accidental deletion.
 *   /override  Destroy even if the object has the SAFE flag.
 *
 * Examples:
 *   @destroy widget              — prompts for confirmation
 *   @destroy/confirm widget      — destroys the object
 *   @destroy/override/confirm #5 — destroys a SAFE-flagged object
 */
export default async (u: IUrsamuSDK) => {
  const actor      = u.me;
  const switches   = u.cmd.switches || [];
  const targetName = (u.cmd.args[0] || "").trim();
  const confirm    = switches.includes("confirm") || switches.includes("override");
  const override   = switches.includes("override");

  if (!targetName) {
    u.send("Usage: @destroy[/confirm] <target>");
    return;
  }

  const results = await u.db.search(targetName);
  const target  = results[0];
  if (!target) { u.send(`Could not find target: ${targetName}`); return; }

  if (!(await u.canEdit(actor, target))) { u.send("You can't destroy that."); return; }
  if (target.flags.has("void"))          { u.send("You can't destroy the void."); return; }
  if (target.flags.has("player"))        { u.send("Use %ch@toad%cn to destroy players."); return; }

  if (target.flags.has("safe") && !override) {
    u.send(`${u.util.displayName(target, actor)} has the SAFE flag. Use %ch@destroy/override/confirm%cn to destroy it.`);
    return;
  }

  if (!confirm) {
    u.send(`Are you sure you want to destroy ${u.util.displayName(target, actor)} (#${target.id})?`);
    u.send(`Use %ch@destroy/confirm ${targetName}%cn to confirm.`);
    return;
  }

  // Send room occupants home before destroying a room
  if (target.flags.has("room") && u.here.id === target.id) {
    const homeId = (actor.state.home as string) || "1";
    u.teleport("me", homeId);
    u.send("You are sent home.");
  }

  const displayName = u.util.displayName(target, actor);
  await u.db.destroy(target.id);
  u.send(`You destroy ${displayName}.`);

  // Clean up orphaned exits
  const orphans = await u.db.search({
    $and: [
      { $or: [{ "data.destination": target.id }, { location: target.id }] },
      { flags: /exit/i },
    ],
  });

  for (const exit of orphans) {
    await u.db.destroy(exit.id);
  }

  if (orphans.length > 0) {
    u.send(`${orphans.length} orphaned exit${orphans.length === 1 ? "" : "s"} also destroyed.`);
  }
};
