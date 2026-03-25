---
topic: "@quota"
section: building
---

# @quota

View or set object quota.

## Syntax

```
@quota                     show your own quota
@quota <player>=<n>        set a player's quota (admin+)
@quota/list                list all players with quota < 50 (admin+)
```

## Switches

| Switch | Effect |
|--------|--------|
| `/list` | List all players with quota below 50 (admin+ only) |

## Examples

```
@quota
@quota Alice=100
@quota/list
```
