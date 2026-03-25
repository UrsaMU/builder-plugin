---
topic: "@zone"
section: building
---

# @zone

Manage Zone Master Objects (ZMOs). A ZMO groups related rooms under a named area.

## Syntax

```
@zone/create <name>
@zone/destroy <name>
@zone/add [<room>=]<zone>
@zone/remove [<room>=]<zone>
@zone/list [<zone>]
@zone/info <zone>
```

## Switches

| Switch | Effect |
|--------|--------|
| `/create` | Create a new ZMO |
| `/destroy` | Destroy the ZMO and unlink all its rooms |
| `/add` | Link a room to a zone (defaults to current room) |
| `/remove` | Unlink a room from its zone |
| `/list` | List all zones, or rooms in a specific zone |
| `/info` | Show zone details and room count |

## Notes

- One zone per room. Assigning a new zone overwrites the old one.
- Destroying a ZMO unlinks all its rooms but does not destroy them.

See also: `help build-files` for saving a zone as a build script.

## Examples

```
@zone/create Market District
@zone/add here=Market District
@zone/list
@zone/list Market District
@zone/info Market District
@zone/remove here=Market District
@zone/destroy Market District
```
