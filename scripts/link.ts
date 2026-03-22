import type { IUrsamuSDK } from "jsr:@ursamu/ursamu";

/**
 * @link <target>=<destination>
 *
 * Links an object to a destination.
 *   Room  → sets dropto
 *   Exit  → sets destination
 *   Other → sets home (requires link_ok or edit permission on destination)
 *
 * Examples:
 *   @link North;N=#5
 *   @link here=#10
 *   @link me=Home
 */
export default async (u: IUrsamuSDK) => {
  const actor = u.me;
  const input = (u.cmd.args[0] || "").trim();
  const match = input.match(/^(.+?)\s*=\s*(.*)$/);

  if (!match) {
    u.send("Usage: @link <target>=<destination>");
    return;
  }

  const targetName = match[1].trim();
  const destName   = match[2].trim();

  const tResults = await u.db.search(targetName);
  const target   = tResults[0];
  if (!target) { u.send(`Could not find target: ${targetName}`); return; }
  if (!(await u.canEdit(actor, target))) { u.send("Permission denied."); return; }

  const dResults    = await u.db.search(destName);
  const destination = dResults[0];
  if (!destination) { u.send(`Could not find destination: ${destName}`); return; }

  if (target.flags.has("room")) {
    await u.db.modify(target.id, "$set", { "data.dropto": destination.id });
  } else if (target.flags.has("exit")) {
    await u.db.modify(target.id, "$set", { "data.destination": destination.id });
  } else {
    const canLinkTo = (await u.canEdit(actor, destination)) || destination.flags.has("link_ok");
    if (!canLinkTo) { u.send("You can't link to that."); return; }
    await u.db.modify(target.id, "$set", { "data.home": destination.id });
  }

  u.send(`You link ${u.util.displayName(target, actor)} to ${u.util.displayName(destination, actor)}.`);
};
