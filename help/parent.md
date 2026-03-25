---
topic: "@parent"
section: building
---

# @parent

Set or clear the parent of an object (prototype inheritance).

## Syntax

```
@parent <target>=<parent>
@parent/clear <target>
```

## Switches

| Switch | Effect |
|--------|--------|
| `/clear` | Remove the parent reference from the target |

## Examples

```
@parent #12=#5
@parent here=#50
@parent/clear #12
```
