# 02 — API Contracts

## Conventions

### Base URL
```
/api/v1
```

### Authentication
All endpoints except `POST /organisations`, `POST /users`, and `POST /invitations/{token}/accept`
require a valid Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### Standard Error Format
All error responses follow this shape consistently:
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable explanation.",
  "details": {}
}
```

### Standard Success Timestamps
All resource responses include `createdAt` and `updatedAt` in ISO 8601 format (`timestamptz`).

### Naming Convention
- All request/response field names use `camelCase`.
- All enum values use `UPPER_SNAKE_CASE` (e.g., `PENDING`, `ACTIVE`).
- Resource IDs are UUIDs returned as strings.

---

## Endpoints

---

### 1. Create Organisation

**`POST /organisations`**

Creates a new organisation. No authentication required (bootstrapping).

#### Request Body
```json
{
  "name": "Sunrise PUC College",
  "orgCode": "PUC-001",
  "orgType": "PUC"
}
```

| Field     | Type   | Required | Notes                              |
|-----------|--------|----------|------------------------------------|
| `name`    | string | ✅       | Max 255 chars                      |
| `orgCode` | string | ✅       | Max 50 chars, must be unique       |
| `orgType` | string | ✅       | One of: `PUC`, `School`, `BCA`, `MCA` |

#### Response — `201 Created`
```json
{
  "id": "a1b2c3d4-...",
  "name": "Sunrise PUC College",
  "orgCode": "PUC-001",
  "orgType": "PUC",
  "createdAt": "2026-02-10T10:00:00Z",
  "updatedAt": "2026-02-10T10:00:00Z"
}
```

#### Error Responses

| Status | Code                  | When                                   |
|--------|-----------------------|----------------------------------------|
| `400`  | `VALIDATION_ERROR`    | Missing/invalid fields                 |
| `409`  | `ORG_CODE_CONFLICT`   | `orgCode` already exists               |

```json
// 400 example
{
  "code": "VALIDATION_ERROR",
  "message": "orgType must be one of PUC, School, BCA, MCA.",
  "details": { "field": "orgType", "value": "University" }
}

// 409 example
{
  "code": "ORG_CODE_CONFLICT",
  "message": "An organisation with code 'PUC-001' already exists.",
  "details": { "orgCode": "PUC-001" }
}
```

---

### 2. Register / Create User

**`POST /users`**

Creates a new user account. No authentication required.

#### Request Body
```json
{
  "email": "akhila@example.com",
  "fullName": "Akhila Sharma",
  "password": "SecurePass@123"
}
```

| Field      | Type   | Required | Notes                             |
|------------|--------|----------|-----------------------------------|
| `email`    | string | ✅       | Must be valid email format        |
| `fullName` | string | ✅       | Max 255 chars                     |
| `password` | string | ✅       | Min 8 chars; stored as hash       |

#### Response — `201 Created`
```json
{
  "id": "u1u2u3u4-...",
  "email": "akhila@example.com",
  "fullName": "Akhila Sharma",
  "createdAt": "2026-02-10T10:05:00Z",
  "updatedAt": "2026-02-10T10:05:00Z"
}
```

**Note:** Password is never returned in any response.

#### Error Responses

| Status | Code               | When                           |
|--------|--------------------|--------------------------------|
| `400`  | `VALIDATION_ERROR` | Missing/invalid fields         |
| `409`  | `EMAIL_CONFLICT`   | Email already registered       |

```json
// 409 example
{
  "code": "EMAIL_CONFLICT",
  "message": "A user with email 'akhila@example.com' already exists.",
  "details": { "email": "akhila@example.com" }
}
```

---

### 3. Invite User to Organisation

**`POST /organisations/{orgId}/invitations`**

Sends an invitation to a user (by email) to join an organisation.

**Authorization:** Caller must be an `Admin` member of the organisation (`role = Admin`, `status = ACTIVE`).

#### Request Body
```json
{
  "email": "newuser@example.com",
  "role": "Staff"
}
```

| Field   | Type   | Required | Notes                          |
|---------|--------|----------|--------------------------------|
| `email` | string | ✅       | Must be valid email format     |
| `role`  | string | ✅       | One of: `Admin`, `Staff`       |

**Idempotency:** If a `PENDING` invitation already exists for this `(orgId, email)`, the request returns `409` instead of creating a duplicate.

#### Response — `201 Created`
```json
{
  "id": "inv1-...",
  "orgId": "a1b2c3d4-...",
  "email": "newuser@example.com",
  "role": "Staff",
  "status": "PENDING",
  "expiresAt": "2026-02-17T10:00:00Z",
  "createdAt": "2026-02-10T10:00:00Z"
}
```

**Note:** The `token` is never returned in the API response. It is delivered to the invitee via email only.

#### Error Responses

| Status | Code                      | When                                                     |
|--------|---------------------------|----------------------------------------------------------|
| `400`  | `VALIDATION_ERROR`        | Missing/invalid fields                                   |
| `401`  | `UNAUTHORIZED`            | No or invalid Bearer token                               |
| `403`  | `FORBIDDEN`               | Caller is not an Admin of this org                       |
| `404`  | `ORG_NOT_FOUND`           | `orgId` does not exist                                   |
| `409`  | `INVITE_ALREADY_PENDING`  | A pending invite for this email+org already exists       |
| `409`  | `ALREADY_A_MEMBER`        | User is already an ACTIVE member of this org             |

```json
// 401 example
{
  "code": "UNAUTHORIZED",
  "message": "A valid Bearer token is required.",
  "details": {}
}

// 403 example
{
  "code": "FORBIDDEN",
  "message": "Only an Admin of this organisation can send invitations.",
  "details": { "requiredRole": "Admin" }
}

// 409 INVITE_ALREADY_PENDING example
{
  "code": "INVITE_ALREADY_PENDING",
  "message": "A pending invitation for 'newuser@example.com' in this organisation already exists.",
  "details": { "email": "newuser@example.com", "orgId": "a1b2c3d4-..." }
}
```

---

### 4. Accept Invite / Activate Membership

**`POST /invitations/{token}/accept`**

Accepts an invitation using the secure token from the invite email.

**Authorization:** No Bearer token required. The `token` in the URL path is the authentication mechanism.

#### URL Parameter
| Parameter | Type   | Notes                                         |
|-----------|--------|-----------------------------------------------|
| `token`   | string | Cryptographically random token from the email |

#### Request Body
```json
{
  "userId": "u1u2u3u4-..."
}
```

| Field    | Type   | Required | Notes                                               |
|----------|--------|----------|-----------------------------------------------------|
| `userId` | string | ✅       | UUID of the user accepting the invite               |

**Note:** The `userId` must match the email on the invitation. If the user has not registered yet, they must call `POST /users` first.

#### Response — `200 OK`
```json
{
  "membershipId": "m1m2m3-...",
  "userId": "u1u2u3u4-...",
  "orgId": "a1b2c3d4-...",
  "role": "Staff",
  "status": "ACTIVE",
  "createdAt": "2026-02-10T10:05:00Z",
  "updatedAt": "2026-02-10T11:00:00Z"
}
```

#### Error Responses

| Status | Code                  | When                                                 |
|--------|-----------------------|------------------------------------------------------|
| `400`  | `VALIDATION_ERROR`    | Missing/invalid `userId`                             |
| `400`  | `EMAIL_MISMATCH`      | `userId` email does not match invitation email       |
| `404`  | `INVITE_NOT_FOUND`    | No invitation found for this token                   |
| `409`  | `INVITE_EXPIRED`      | Invitation has passed its `expiresAt` timestamp      |
| `409`  | `INVITE_NOT_PENDING`  | Invitation was already accepted, expired, or revoked |
| `409`  | `ALREADY_A_MEMBER`    | User already has an ACTIVE membership in this org    |

```json
// 404 example
{
  "code": "INVITE_NOT_FOUND",
  "message": "No invitation found for the provided token.",
  "details": {}
}

// 409 INVITE_EXPIRED example
{
  "code": "INVITE_EXPIRED",
  "message": "This invitation expired on 2026-02-17T10:00:00Z.",
  "details": { "expiresAt": "2026-02-17T10:00:00Z" }
}

// 409 INVITE_NOT_PENDING example
{
  "code": "INVITE_NOT_PENDING",
  "message": "This invitation has already been accepted.",
  "details": { "currentStatus": "ACCEPTED" }
}
```

---

### 5. Get Organisation Members

**`GET /organisations/{orgId}/members`**

Returns a list of all ACTIVE members of an organisation.

**Authorization:** Caller must be an `Admin` or `Staff` member of the organisation (any active member can view the list).

#### Query Parameters (optional)
| Param    | Type   | Notes                           |
|----------|--------|---------------------------------|
| `role`   | string | Filter by `Admin` or `Staff`    |
| `status` | string | Filter by `PENDING` or `ACTIVE` |

#### Response — `200 OK`
```json
{
  "orgId": "a1b2c3d4-...",
  "members": [
    {
      "membershipId": "m1m2m3-...",
      "userId": "u1u2u3u4-...",
      "fullName": "Akhila Sharma",
      "email": "akhila@example.com",
      "role": "Admin",
      "status": "ACTIVE",
      "joinedAt": "2026-02-10T11:00:00Z"
    },
    {
      "membershipId": "m4m5m6-...",
      "userId": "u5u6u7u8-...",
      "fullName": "Ravi Kumar",
      "email": "ravi@example.com",
      "role": "Staff",
      "status": "ACTIVE",
      "joinedAt": "2026-02-11T09:00:00Z"
    }
  ],
  "total": 2
}
```

#### Error Responses

| Status | Code               | When                                              |
|--------|--------------------|---------------------------------------------------|
| `401`  | `UNAUTHORIZED`     | No or invalid Bearer token                        |
| `403`  | `FORBIDDEN`        | Caller is not a member of this org                |
| `404`  | `ORG_NOT_FOUND`    | `orgId` does not exist                            |

```json
// 403 example
{
  "code": "FORBIDDEN",
  "message": "You must be a member of this organisation to view its members.",
  "details": {}
}
```

---

## Authorization Rules Summary

| Endpoint                               | Who can call it                                     |
|----------------------------------------|-----------------------------------------------------|
| `POST /organisations`                  | Anyone (unauthenticated)                            |
| `POST /users`                          | Anyone (unauthenticated)                            |
| `POST /organisations/{orgId}/invitations` | Authenticated user who is an **Admin** of the org  |
| `POST /invitations/{token}/accept`     | Anyone with a valid token (no auth header needed)   |
| `GET /organisations/{orgId}/members`   | Authenticated user who is any **active member** of the org |
