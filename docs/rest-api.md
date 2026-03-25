# REST API Reference

Base path: `/api/v1/building/`
Auth: `Authorization: Bearer <token>` required on all routes.
Callers must have the `builder+` flag; staff (admin/wizard/superuser) can access any object.

---

## Rooms

### `GET /api/v1/building/rooms`

List rooms owned by the authenticated player. Staff see all rooms.

**Response `200`**
```json
[
  { "id": "abc123", "name": "The Library", "description": "Rows of ancient tomes." }
]
```

---

### `POST /api/v1/building/rooms`

Create a room.

**Body**
```json
{
  "name": "The Library",
  "description": "Rows of ancient tomes.",
  "parent": "optional-room-id"
}
```

| Field | Type | Required | Limits |
|-------|------|----------|--------|
| `name` | string | yes | ≤ 200 chars |
| `description` | string | no | ≤ 4096 chars |
| `parent` | string | no | valid object ID, ≤ 64 chars |

**Response `201`**
```json
{ "id": "abc123", "flags": "room", "data": { "name": "The Library", "description": "...", "owner": "player-id" } }
```

---

### `GET /api/v1/building/rooms/:id`

Get details for a single room.

**Response `200`** — full room object
**Response `404`** — room not found
**Response `403`** — not your room (non-staff)

---

### `PATCH /api/v1/building/rooms/:id`

Update a room's name or description.

**Body** (all fields optional, at least one required)
```json
{ "name": "New Name", "description": "New description." }
```

| Field | Limits |
|-------|--------|
| `name` | ≤ 200 chars |
| `description` | ≤ 4096 chars |

**Response `200`** — updated fields
**Response `400`** — nothing to update / validation error

Fires `object:modified` event.

---

### `DELETE /api/v1/building/rooms/:id`

Destroy a room. Orphaned exits (exits pointing to or located in this room) are automatically removed.

**Response `204`** — no content
**Response `404`** — room not found

Fires `object:destroyed` event.

---

## Exits

### `POST /api/v1/building/rooms/:id/exits`

Create an exit from a room.

**Body**
```json
{ "name": "North;N", "destination": "room-id" }
```

| Field | Type | Required | Limits |
|-------|------|----------|--------|
| `name` | string | yes | ≤ 200 chars; use `;` to separate aliases |
| `destination` | string | yes | must be an existing room ID |

**Response `201`**
```json
{ "id": "exit-id", "flags": "exit", "location": "source-room-id", "data": { "name": "North;N", "destination": "room-id" } }
```

Fires `object:created` event.

---

## Objects

### `GET /api/v1/building/objects/:id`

Generic detail view for any object type (room, exit, thing, player).

**Response `200`**
```json
{
  "id": "abc123",
  "flags": "room",
  "type": "room",
  "name": "The Library",
  "description": "Rows of ancient tomes.",
  "owner": "player-id",
  "location": "parent-room-id"
}
```

**Response `404`** — object not found
**Response `403`** — not your object (non-staff)

---

## Events

These `gameHooks` events are emitted by REST API operations. In-game commands (`@dig`, `@describe`, etc.) run in the sandbox and do not emit these events.

| Event | When |
|-------|------|
| `object:created` | Room or exit created |
| `object:destroyed` | Room destroyed |
| `object:modified` | Room name or description patched |

**`object:created` payload**
```ts
{ objectId, objectName, objectType, actorId, actorName, locationId? }
```

**`object:destroyed` payload**
```ts
{ objectId, objectName, objectType, actorId, actorName }
```

**`object:modified` payload**
```ts
{ objectId, objectName, field, actorId, actorName }
```

---

## Error format

All errors return JSON:

```json
{ "error": "Human-readable message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing/invalid field) |
| 401 | Missing or invalid auth token |
| 403 | Authenticated but not permitted (wrong owner, missing flag) |
| 404 | Object not found |
