# Build Files

Build files let you export a zone as a plain-text script and replay it later to recreate the whole area from scratch. This is useful for backups, sharing maps, and staging builds.

## Format

A build file is a plain text file in the `builds/` directory (relative to the game root). Each line is one in-game command. Lines starting with `#` are comments and are skipped. Blank lines are skipped.

```
# UrsaMU Build Script
# Zone: Market District (#50)
# Generated: 2026-03-24

# ─── Room: Market Square (#5) ───
@dig/teleport Market Square
@describe here=A bustling square filled with merchants.
@zone/add here=Market District
@open North;N=The Tavern

# ─── Room: The Tavern (#6) ───
@dig/teleport The Tavern
@describe here=A warm tavern.
@zone/add here=Market District
@open South;S=Market Square
```

`@dig/teleport` creates the room **and** steps you into it, so subsequent `@describe` and `@open` commands apply to the right room.

## Saving a zone

```
@batchbuild/save Market District=market
```

Exports the "Market District" zone to `builds/market.txt`. The filename may only contain letters, digits, hyphens, and underscores.

## Running a build file

```
@batchbuild/run market
```

Reads `builds/market.txt` and executes each command in order. Progress and any errors are reported as each command runs.

```
@batchbuild/list
```

Lists all `.txt` files in the `builds/` directory.

## Cross-zone exits

When a room in the zone has an exit that leads to a room **outside** the zone, that exit cannot be reconstructed automatically (the destination ID won't exist in the new game). These exits are preserved as comments:

```
# @open East;E=#99  (cross-zone exit — restore manually)
```

After running the build file, reconnect these exits by hand using `@open` and `@link`.

## Limits

- Max **2000 commands** per file. Files over this limit are rejected with an error.
- Filename characters: `A-Z a-z 0-9 - _` only (no dots, slashes, or spaces).
- The `.txt` extension is optional when running: `@batchbuild/run market` and `@batchbuild/run market.txt` are equivalent.

## Editing build files by hand

Build files are plain text — you can edit them directly in any text editor before running. Useful patterns:

- Add `# ── Section ──` comments to document areas.
- Comment out rooms you don't want to rebuild with `#`.
- Change room names or descriptions in bulk with find-and-replace.
- Insert `@set here=DARK` or other one-off commands between the standard lines.

## Full example

```
# Build the zone
@zone/create Market District

# Room 1
@dig/teleport Market Square
@describe here=A busy crossroads.
@zone/add here=Market District

# Room 2
@dig/teleport The Tavern
@describe here=A rowdy tavern.
@zone/add here=Market District

# Exits
@open North;N=The Tavern
@open South;S=Market Square

# Save it
@batchbuild/save Market District=market

# Later, on a fresh server, recreate the whole thing:
@batchbuild/run market
```
