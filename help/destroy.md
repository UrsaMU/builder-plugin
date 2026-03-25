---
topic: "@destroy"
section: building
---

# @destroy

Destroy an object. Prompts for confirmation unless `/confirm` is given.

## Syntax

```
@destroy <target>
@destroy/confirm <target>
@destroy/override <target>
```

## Switches

| Switch | Effect |
|--------|--------|
| `/confirm` | Skip confirmation prompt and destroy immediately |
| `/override` | Bypass safety checks (use with care) |

## Notes

- When destroying a room: connected occupants are sent home first, orphaned exits are removed, and quota is refunded to the non-staff owner.

## Examples

```
@destroy Rusty Sword
@destroy/confirm #12
@destroy/confirm here
```
