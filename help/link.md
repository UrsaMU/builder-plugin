---
topic: "@link"
section: building
---

# @link

Link a target to a destination. What "link" means depends on the object type.

## Syntax

```
@link <target>=<dest>
@link <target>=home
```

## Object types

| Target type | Effect |
|-------------|--------|
| Room | Sets the room's dropto |
| Exit | Sets the exit's destination |
| Thing / player | Sets the object's home |

## Notes

- `home` resolves to your current room without needing its dbref.

## Examples

```
@link North;N=The Tavern
@link here=home
@link #12=#5
```
