# builder-plugin

> World-building commands and REST API for UrsaMU — dig rooms, create exits, describe objects, and build programmatically.

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
  "ref": "v1.0.0",
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

## Notes

- REST routes persist until server restart (no unload mechanism for `registerPluginRoute`).
- Scripts registered via `registerScript()` are also persistent until restart — local `system/scripts/` overrides still take priority.
- Orphaned exits are automatically cleaned up when a room is destroyed.
