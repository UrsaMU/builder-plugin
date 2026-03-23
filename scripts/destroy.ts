import type { IUrsamuSDK } from "jsr:@ursamu/ursamu";

/**
 * @destroy[/confirm][/override] <target>
 *
 * Destroys an object. Requires /confirm to proceed. When destroying a room,
 * all connected occupants are sent to their home first. The object's owner
 * receives a quota refund (unless they are staff). Orphaned exits are cleaned
 * up automatically.
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

  // Evict ALL connected occupants before destroying a room
  if (target.flags.has("room")) {
    const occupants = await u.db.search({
      $and: [{ location: target.id }, { flags: /connected/i }],
    });
    for (const occ of occupants) {
      const homeId = (occ.state.home as string) || "1";
      u.send("The room crumbles around you. You are sent home.", occ.id);
      u.teleport(occ.id, homeId);
    }
  }

  const displayName = u.util.displayName(target, actor);
  await u.db.destroy(target.id);
  u.send(`You destroy ${displayName}.`);

  // Refund quota to non-staff owner
  const ownerId = target.state.owner as string | undefined;
  if (ownerId) {
    const ownerResults = await u.db.search({ id: ownerId });
    const owner        = ownerResults[0];
    const isStaff      = owner?.flags.has("wizard") || owner?.flags.has("admin") || owner?.flags.has("superuser");
    if (owner && !isStaff) {
      await u.db.modify(owner.id, "$inc", { "data.quota": 1 });
    }
  }

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
