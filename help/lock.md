---
topic: "@lock"
section: building
aliases: ["@unlock"]
---

# @lock / @unlock

Lock or unlock an object with a key expression.

## Syntax

```
@lock <target>=<key>
@lock/<type> <target>=<key>
@unlock <target>
@unlock/<type> <target>
```

## Notes

- Lock types (e.g. `/use`, `/enter`, `/drop`) depend on the engine's supported lock slots.

## Examples

```
@lock North;N=me
@lock/enter here=WIZARD
@unlock North;N
@unlock/enter here
```
