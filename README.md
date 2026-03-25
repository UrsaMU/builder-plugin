# builder-plugin

> World-building commands, zone management, and build file tools for UrsaMU.

## Commands

| Command | Syntax | Lock | Description |
|---------|--------|------|-------------|
| `@dig` | `@dig[/tel] <room>[=<exit>[,<back>]]` | builder+ | Create room and optional exits |
| `@open` | `@open[/inventory] <exit>=<room>[,<back>]` | builder+ | Create exits |
| `@link` | `@link <target>=<dest>` | builder+ | Link room (dropto), exit (dest), or thing (home) |
| `@unlink` | `@unlink <target>` | builder+ | Remove link from room or exit |
| `@clone` | `@clone <obj>=<name>` | builder+ | Duplicate an object into inventory |
| `@destroy` | `@destroy[/confirm][/override] <target>` | builder+ | Destroy an object (with confirmation) |
| `@describe` | `@describe <target>=<text>` | builder+ | Set object description |
| `@examine` | `@examine [<target>]` | builder+ | Detailed object info |
| `@name` | `@name <target>=<newname>` | builder+ | Rename an object |
| `@set` | `@set <target>=<FLAG>` or `@set <target>/<ATTR>=<val>` | builder+ | Set flags or attributes |
| `&ATTR` | `&ATTR <obj>=<value>` | builder+ | Set a named attribute |
| `@lock` | `@lock[/<type>] <target>=<key>` | builder+ | Lock an object |
| `@unlock` | `@unlock[/<type>] <target>` | builder+ | Unlock an object |
| `@parent` | `@parent[/clear] <target>[=<parent>]` | builder+ | Set/clear parent object |
| `@quota` | `@quota [<player>=<n>]` | connected / admin+ | View or set quota |
| `@wipe` | `@wipe[/confirm] <target>` | builder+ | Wipe all attributes |
| `@oemit` | `@oemit <message>` | connected | Emit to others in current room (unattributed) |
| `@zone` | `@zone[/<switch>] [<args>]` | builder+ | Manage Zone Master Objects |
| `@batchbuild` | `@batchbuild[/<switch>] <args>` | admin+ | Save/run build script files |

### @zone switches

| Switch | Syntax | Description |
|--------|--------|-------------|
| `/create` | `@zone/create <name>` | Create a Zone Master Object (ZMO) |
| `/destroy` | `@zone/destroy <name>` | Destroy a ZMO and unlink all its rooms |
| `/add` | `@zone/add [<room>=]<zone>` | Link a room to a zone (defaults to current room) |
| `/remove` | `@zone/remove [<room>=]<zone>` | Unlink a room from a zone |
| `/list` | `@zone/list [<zone>]` | List all zones, or rooms in a zone |
| `/info` | `@zone/info <zone>` | Show zone details and room count |

### @batchbuild switches

| Switch | Syntax | Description |
|--------|--------|-------------|
| `/save` | `@batchbuild/save <zone>=<filename>` | Export zone to `builds/<filename>.txt` |
| `/run` | `@batchbuild/run <filename>` | Execute all commands from a build file |
| `/list` | `@batchbuild/list` | List saved build files |

## REST API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/building/rooms` | Bearer | List owned rooms |
| `POST` | `/api/v1/building/rooms` | Bearer | Create a room |
| `GET` | `/api/v1/building/rooms/:id` | Bearer | Get room details |
| `PATCH` | `/api/v1/building/rooms/:id` | Bearer | Update room name/description |
| `DELETE` | `/api/v1/building/rooms/:id` | Bearer | Destroy a room |
| `POST` | `/api/v1/building/rooms/:id/exits` | Bearer | Create an exit from a room |
| `GET` | `/api/v1/building/objects/:id` | Bearer | Generic object info |

### POST /api/v1/building/rooms

```json
{ "name": "The Library", "description": "Rows of ancient tomes.", "parent": "optional-room-id" }
```

Response `201`:
```json
{ "id": "abc123", "flags": "room", "data": { "name": "The Library", ... } }
```

### POST /api/v1/building/rooms/:id/exits

```json
{ "name": "North;N", "destination": "room-id" }
```

## Events

| Event | Payload | When fired |
|-------|---------|------------|
| `object:created` | `{ objectId, objectName, objectType, actorId, actorName, locationId? }` | Room, exit, or thing created via REST API |
| `object:destroyed` | `{ objectId, objectName, objectType, actorId, actorName }` | Object destroyed via REST API |
| `object:modified` | `{ objectId, objectName, field, actorId, actorName }` | Object patched via REST API |

> Note: In-game commands (`@dig`, `@describe`, etc.) do not currently emit these hooks — they run in the sandbox without direct `gameHooks` access. The REST API emits all three events.

## Install

Add to `plugins.manifest.json` in your game project:

```json
{
  "name": "builder",
  "url": "https://github.com/UrsaMU/builder-plugin",
  "ref": "v1.2.0",
  "description": "World-building commands and REST API",
  "ursamu": ">=1.9.5"
}
```

Or via the CLI:

```bash
deno task cli plugin add https://github.com/UrsaMU/builder-plugin
```

## Configuration

No configuration required. All commands respect the player's quota. Staff (admin/wizard/superuser) bypass quota checks.

## Zones

A **Zone Master Object (ZMO)** is a game object (`thing zone`) that rooms can be linked to. Rooms reference their zone via `state.zone = <zmoId>`. One zone per room maximum; assigning a new zone overwrites the old one.

```
@zone/create Market District          ← creates ZMO #50
@dig/teleport Market Square           ← create and enter the room
@describe here=A bustling square.
@zone/add here=Market District        ← link room to zone
@zone/list Market District            ← see all rooms in zone
```

## Build Files

Build files are plain text files saved in the `builds/` directory (relative to the game root). Each non-blank, non-`#` line is an in-game command. Lines starting with `#` are comments.

```bash
@batchbuild/save Market District=market   ← saves builds/market.txt
@batchbuild/run market                    ← re-runs the whole zone
@batchbuild/list                          ← see all saved files
```

Generated file format:
```
# UrsaMU Build Script
# Zone: Market District (#50)
# Generated: 2026-03-24

# ─── Room: Market Square (#5) ───
@dig/teleport Market Square
@describe here=A bustling square filled with merchants.
@zone/add here=Market District
@open North;N=The Tavern

# ─── Room: The Tavern (#6) ───
@dig/teleport The Tavern
@describe here=A warm tavern.
@zone/add here=Market District
@open South;S=Market Square
```

Cross-zone exits (exits whose destination is outside the saved zone) are preserved as comments and must be restored manually.

## Notes

- REST routes persist until server restart (no unload mechanism for `registerPluginRoute`).
- Scripts registered via `registerScript()` are also persistent until restart — local `system/scripts/` overrides still take priority.
- Orphaned exits are automatically cleaned up when a room is destroyed.
- `@destroy` sends all connected occupants home before removing a room, then refunds quota to the non-staff owner.
- `@link <target>=home` sets the link destination to your current room without needing its dbref.
- `@oemit` sends to everyone in your current room except yourself — useful for room events and softcode triggers.
- `@batchbuild/run` has a hard cap of 2000 commands per file to prevent runaway execution.
- Build file names may only contain letters, digits, hyphens, and underscores (no path traversal).
