# builder-plugin

> World-building commands, zone management, and build-file tools for UrsaMU.

## Install

Add to `plugins.manifest.json`:

```json
{
  "name": "builder",
  "url": "https://github.com/UrsaMU/builder-plugin",
  "ref": "v1.2.0",
  "ursamu": ">=1.9.5"
}
```

Or via CLI: `deno task cli plugin add https://github.com/UrsaMU/builder-plugin`

## Commands

| Command | Lock | Summary |
|---------|------|---------|
| `@dig` | builder+ | Create a room (and optional exits) |
| `@open` | builder+ | Create exits |
| `@link` | builder+ | Link room (dropto), exit (dest), or thing (home) |
| `@unlink` | builder+ | Remove a link |
| `@describe` | builder+ | Set object description |
| `@name` | builder+ | Rename an object |
| `@examine` | builder+ | Detailed object info |
| `@set` | builder+ | Set flags or attributes |
| `&ATTR` | builder+ | Set a named attribute |
| `@lock` / `@unlock` | builder+ | Lock or unlock an object |
| `@parent` | builder+ | Set or clear parent object |
| `@clone` | builder+ | Duplicate an object |
| `@destroy` | builder+ | Destroy an object |
| `@wipe` | builder+ | Wipe all attributes |
| `@oemit` | connected | Emit to others in room (unattributed) |
| `@quota` | connected / admin+ | View or set quota |
| `@zone` | builder+ | Manage Zone Master Objects |
| `@batchbuild` | admin+ | Save / run zone build scripts |

Full syntax, switches, and examples → **[docs/commands.md](docs/commands.md)**

## REST API

`/api/v1/building/` — Bearer auth required.
Full reference → **[docs/rest-api.md](docs/rest-api.md)**

## Guides

- [Zones](docs/zones.md) — grouping rooms with Zone Master Objects
- [Build Files](docs/build-files.md) — saving and replaying world builds
