# Zones

A **Zone Master Object (ZMO)** is a game object that rooms can be linked to, letting you group related rooms under a named area. This makes it easy to list, describe, and export an entire district or dungeon floor as a unit.

## Concepts

- A ZMO is a `thing zone` object. It lives in your inventory after creation.
- Rooms reference their zone via `data.zone = <zmoId>`.
- One zone per room. Assigning a new zone overwrites the old one.
- Destroying a ZMO automatically unlinks all its rooms.

## Creating a zone

```
@zone/create Market District
```

Creates a ZMO named "Market District" and reports its dbref (e.g. `#50`).

## Adding rooms

```
@dig/teleport Market Square
@zone/add here=Market District

@dig/teleport The Tavern
@zone/add here=Market District
```

You can also add a room by dbref or name while standing elsewhere:

```
@zone/add #12=Market District
@zone/add The Tavern=Market District
```

## Listing zones and rooms

```
@zone/list                       ← all zones with room counts
@zone/list Market District       ← all rooms in a specific zone
@zone/info Market District       ← ID, owner, room count, description
```

## Removing rooms

```
@zone/remove here=Market District
@zone/remove #12=Market District
```

Removes the room from its zone. The room itself is not destroyed.

## Destroying a zone

```
@zone/destroy Market District
```

Destroys the ZMO and unlinks all its rooms. The rooms themselves are not destroyed — they just lose their zone reference.

## Full walkthrough

```
@zone/create Market District          creates ZMO #50

@dig/teleport Market Square
@describe here=A bustling square filled with merchants.
@zone/add here=Market District

@dig/teleport The Tavern
@describe here=A warm tavern with a roaring fire.
@zone/add here=Market District

@open North;N=The Tavern            exit from Market Square to The Tavern
@open South;S=Market Square         exit back

@zone/list Market District           confirms both rooms are listed
@zone/info Market District           shows count = 2
```

Once the zone is ready, save it as a build file:

```
@batchbuild/save Market District=market
```

See [build-files.md](build-files.md) for details.
