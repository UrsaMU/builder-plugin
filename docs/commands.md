# Command Reference

All commands require the `builder+` flag unless noted. Staff (admin / wizard / superuser) bypass quota checks.

---

## @dig

Create a room. Optionally create an exit from your current location into it and a return exit.

```
@dig <room>
@dig <room>=<exit>
@dig <room>=<exit>,<back>
@dig/teleport <room>
```

| Switch | Effect |
|--------|--------|
| `/teleport` | Move into the new room after creating it |

**Quota:** costs 1 per room (staff exempt).

---

## @open

Create an exit from your current room to a destination.

```
@open <exit>=<room>
@open <exit>=<room>,<back>
@open/inventory <exit>=<room>
```

| Switch | Effect |
|--------|--------|
| `/inventory` | Place the exit in your inventory instead of the current room |

---

## @link

Link a target to a destination. What "link" means depends on the object type.

```
@link <target>=<dest>
@link <target>=home
```

| Target type | Effect |
|-------------|--------|
| Room | Sets the room's dropto |
| Exit | Sets the exit's destination |
| Thing / player | Sets the object's home |

`home` resolves to your current room without needing its dbref.

---

## @unlink

Remove the link from a room (dropto) or exit (destination).

```
@unlink <target>
```

---

## @describe

Set the description shown when someone looks at an object.

```
@describe <target>=<text>
@desc <target>=<text>
```

Max 4096 characters.

---

## @name

Rename an object. Checks for name collisions. Clears the moniker when a player is renamed.

```
@name <target>=<newname>
```

Max 200 characters.

---

## @examine

Show detailed information about an object: flags, owner, lock, location, home, description, exits, contents, and attributes. Defaults to the current room.

```
@examine
@examine <target>
@ex <target>
```

---

## @set

Set flags or soft attributes on an object.

```
@set <target>=<FLAG>          add a flag
@set <target>=!<FLAG>         remove a flag
@set <target>=<F1> <F2> <!F3> set/unset multiple flags
@set <target>/<ATTR>=<value>  set a soft attribute
@set <target>/<ATTR>=         clear a soft attribute
```

Attribute names: letters, digits, underscores only. Max value 4096 chars. Max 100 attributes per object.

---

## &ATTR

Shorthand to set a named attribute.

```
&ATTR <obj>=<value>
&ATTR <obj>=          clears the attribute
```

Max value 4096 chars. Max 100 attributes per object.

---

## @lock / @unlock

Lock or unlock an object with a key expression.

```
@lock <target>=<key>
@lock/<type> <target>=<key>
@unlock <target>
@unlock/<type> <target>
```

Lock types (e.g. `/use`, `/enter`, `/drop`) depend on the engine's supported lock slots.

---

## @parent

Set or clear the parent of an object (prototype inheritance).

```
@parent <target>=<parent>
@parent/clear <target>
```

---

## @clone

Duplicate an object into your inventory. Cannot clone players or rooms.

```
@clone <obj>
@clone <obj>=<new name>
```

Copies flags, description, and attributes. Costs 1 quota (staff exempt). Max name 200 chars.

---

## @destroy

Destroy an object. Prompts for confirmation unless `/confirm` is given.

```
@destroy <target>
@destroy/confirm <target>
@destroy/override <target>
```

When destroying a room: connected occupants are sent home first, orphaned exits are removed, and quota is refunded to the non-staff owner.

---

## @wipe

Remove all soft attributes from an object.

```
@wipe <target>
@wipe/confirm <target>
```

Without `/confirm`, shows a preview and asks you to re-run with the switch.

---

## @oemit

Emit a message to everyone in your current room except yourself. No actor attribution.

```
@oemit <message>
```

Lock: `connected` (no builder flag required).

---

## @quota

View or set object quota.

```
@quota                    show your own quota
@quota <player>=<n>       set a player's quota (admin+)
@quota/list               list all players with quota < 50 (admin+)
```

---

## @zone

Manage Zone Master Objects (ZMOs). See [zones.md](zones.md) for a full guide.

```
@zone/create <name>
@zone/destroy <name>
@zone/add [<room>=]<zone>
@zone/remove [<room>=]<zone>
@zone/list [<zone>]
@zone/info <zone>
```

| Switch | Effect |
|--------|--------|
| `/create` | Create a new ZMO |
| `/destroy` | Destroy the ZMO and unlink all its rooms |
| `/add` | Link a room to a zone (defaults to current room) |
| `/remove` | Unlink a room from its zone |
| `/list` | List all zones, or rooms in a specific zone |
| `/info` | Show zone details and room count |

---

## @batchbuild

Save a zone to a plain-text build script, or replay a saved script. Admin+ only. See [build-files.md](build-files.md) for a full guide.

```
@batchbuild/save <zone>=<filename>
@batchbuild/run <filename>
@batchbuild/list
```

| Switch | Effect |
|--------|--------|
| `/save` | Export a zone's rooms and exits to `builds/<filename>.txt` |
| `/run` | Execute all commands in a build file, line by line |
| `/list` | List all saved build files |

File names: letters, digits, hyphens, and underscores only. Max 2000 commands per file.
