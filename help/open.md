---
topic: "@open"
section: building
---

# @open

Create an exit from your current room to a destination.

## Syntax

```
@open <exit>=<room>
@open <exit>=<room>,<back>
@open/inventory <exit>=<room>
```

## Switches

| Switch | Effect |
|--------|--------|
| `/inventory` | Place the exit in your inventory instead of the current room |

## Notes

- Use `;` to separate the primary name from aliases (e.g. `North;N`).
- Exit names may be up to 200 characters.

## Examples

```
@open North;N=The Tavern
@open East;E=The Library,West;W
@open/inventory Gate=Courtyard
```
