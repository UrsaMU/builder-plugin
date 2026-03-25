---
topic: "@dig"
section: building
---

# @dig

Create a room. Optionally create an exit from your current location into it and a return exit.

## Syntax

```
@dig <room>
@dig <room>=<exit>
@dig <room>=<exit>,<back>
@dig/teleport <room>
```

## Switches

| Switch | Effect |
|--------|--------|
| `/teleport` | Move into the new room after creating it |

## Notes

- Costs 1 quota per room. Staff are exempt from quota checks.
- Room names may be up to 200 characters.

## Examples

```
@dig Storage Room
@dig/teleport The Tavern
@dig Market Square=North;N,South;S
```
