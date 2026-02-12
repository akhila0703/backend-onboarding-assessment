# 04 — Controller & Service Design

## Architecture Overview

```
HTTP Request
    │
    ▼
Controller        → thin layer: receives request, calls service, returns response
    │
    ▼
Service           → owns all business logic, conflict checks, state transitions
    │
    ▼
Repository/ORM    → only layer that touches the DB
```

---

## Interfaces (DTOs & Return Types)

```
// Auth
ICurrentUser { id: uuid | string }

// Organisation
ICreateOrganisationDto  { name: string, orgCode: string, orgType: 'PUC' | 'School' | 'BCA' | 'MCA' }
IOrganisationResponse   { id: uuid | string, name: string, orgCode: string, orgType: string, createdAt: string, updatedAt: string }

// User
ICreateUserDto    { email: string, fullName: string, password: string }
IUserResponse     { id: uuid | string, email: string, fullName: string, createdAt: string, updatedAt: string }

// Membership
IMembershipResponse  { membershipId: uuid | string, userId: uuid | string, orgId: uuid | string, role: 'Admin' | 'Staff', status: 'PENDING' | 'ACTIVE', updatedAt: string }
IMembersListResponse { orgId: uuid | string, members: IMemberItem[], total: number }
IMemberItem          { membershipId: uuid | string, userId: uuid | string, fullName: string, email: string, role: string, status: string, joinedAt: string }

// Invitation
IInviteUserDto      { email: string, role: 'Admin' | 'Staff' }
IInvitationResponse { id: uuid | string, orgId: uuid | string, email: string, role: string, status: string, expiresAt: string, createdAt: string }

// Accept Invite
IAcceptInviteDto  { userId: uuid | string }

// List Members Query
IListMembersQuery { role?: 'Admin' | 'Staff', status?: 'PENDING' | 'ACTIVE' }
```

---

## 1. OrganisationsController

**Responsibility:** Handles org creation and member listing. Protected routes use JWT guard.

```
OrganisationsController

  POST /organisations
    input  : ICreateOrganisationDto
    output : IOrganisationResponse
    auth   : none
    calls  : OrganisationsService.createOrganisation(dto)

  GET /organisations/:orgId/members
    input  : orgId: string, query: IListMembersQuery, caller: ICurrentUser
    output : IMembersListResponse
    auth   : JWT required (any active member of the org)
    calls  : OrganisationsService.getMembers(orgId, callerId, query)
```

---

## 2. OrganisationsService

**Responsibility:** Business logic for org creation and member listing.

```
OrganisationsService

  createOrganisation(dto: ICreateOrganisationDto) → IOrganisationResponse
    1. READ  organisations  → check orgCode uniqueness
       conflict? → throw 409 ORG_CODE_CONFLICT
    2. WRITE organisations  → INSERT new row
    3. return IOrganisationResponse

  getMembers(orgId: string, callerId: string, query: IListMembersQuery) → IMembersListResponse
    1. READ  organisations  → check org exists
       not found? → throw 404 ORG_NOT_FOUND
    2. READ  memberships    → check caller is ACTIVE member
       not member? → throw 403 FORBIDDEN
    3. READ  memberships + users JOIN → fetch list with optional role/status filters
    4. return IMembersListResponse
```

---

## 3. UsersController

**Responsibility:** Handles user registration only.

```
UsersController

  POST /users
    input  : ICreateUserDto
    output : IUserResponse
    auth   : none
    calls  : UsersService.createUser(dto)
```

---

## 4. UsersService

**Responsibility:** User creation and lookup by ID.

```
UsersService

  createUser(dto: ICreateUserDto) → IUserResponse
    1. READ  users  → check email uniqueness
       conflict? → throw 409 EMAIL_CONFLICT
    2. hash password (argon2/bcrypt)
    3. WRITE users  → INSERT new row
    4. return IUserResponse  (password_hash excluded)

  findById(userId: string) → IUser { id: uuid | string, email: string, fullName: string }
    1. READ  users  → find by id
       not found? → throw 404 USER_NOT_FOUND
    2. return IUser
```

---

## 5. OnboardingController

**Responsibility:** Handles invite sending (JWT protected) and invite acceptance (token-based, no JWT needed).

```
OnboardingController

  POST /organisations/:orgId/invitations
    input  : orgId: string, dto: IInviteUserDto, caller: ICurrentUser
    output : IInvitationResponse
    auth   : JWT required (caller must be Admin of org)
    calls  : OnboardingService.inviteUser(orgId, callerId, dto)

  POST /invitations/:token/accept
    input  : token: string, dto: IAcceptInviteDto
    output : IMembershipResponse
    auth   : none (token in URL is the auth mechanism)
    calls  : OnboardingService.acceptInvite(token, dto)
```

---

## 6. OnboardingService

**Responsibility:** All invite and membership business logic — role checks, conflict checks, token generation, and state transitions.

```
OnboardingService

  inviteUser(orgId: string, callerId: string, dto: IInviteUserDto) → IInvitationResponse
    1. READ  memberships    → verify caller is Admin of org
       not Admin? → throw 403 FORBIDDEN
    2. READ  organisations  → verify org exists
       not found? → throw 404 ORG_NOT_FOUND
    3. READ  memberships    → check invitee is not already ACTIVE member
       already member? → throw 409 ALREADY_A_MEMBER
    4. READ  invitations    → check no PENDING invite for (orgId, email)
       pending exists? → throw 409 INVITE_ALREADY_PENDING
    5. generate token: string (crypto random 32-byte hex)
       set expiresAt: now + 7 days
    6. WRITE invitations    → INSERT { orgId, email, role, token, invitedBy, expiresAt, status: PENDING }
    7. WRITE memberships    → INSERT { orgId, userId, role, status: PENDING }
    8. return IInvitationResponse  (token excluded from response — sent via email only)

  acceptInvite(token: string, dto: IAcceptInviteDto) → IMembershipResponse
    1. READ  invitations    → find invite by token
       not found? → throw 404 INVITE_NOT_FOUND
    2. check invite.status === PENDING
       not pending? → throw 409 INVITE_NOT_PENDING { currentStatus: string }
    3. check now() < invite.expiresAt
       expired?
         WRITE invitations → UPDATE status = EXPIRED
         throw 409 INVITE_EXPIRED { expiresAt: string }
    4. READ  users          → verify userId exists + email matches invite.email
       not found? → throw 404 USER_NOT_FOUND
       email mismatch? → throw 400 EMAIL_MISMATCH
    5. READ  memberships    → check no ACTIVE membership for (orgId, userId)
       already active? → throw 409 ALREADY_A_MEMBER
    6. READ  memberships    → find PENDING membership for (orgId, userId)
       found?     → WRITE memberships → UPDATE status = ACTIVE
       not found? → WRITE memberships → INSERT { orgId, userId, role, status: ACTIVE }
    7. WRITE invitations    → UPDATE status = ACCEPTED
       (steps 6 + 7 wrapped in a DB transaction for atomicity)
    8. return IMembershipResponse
```

---

## 7. Validation Ownership

```
DTO / ValidationPipe   → field types, formats, required checks
                          e.g. email is valid format, orgType is valid enum value

Service (business)     → conflict and rule checks
                          e.g. orgCode uniqueness, duplicate invite, role authorization

JwtAuthGuard           → verifies Bearer token is valid and not expired

Database (last net)    → enforces UNIQUE constraints as final safety
                          e.g. UNIQUE(user_id, org_id) on memberships
```

---

## 8. Who Activates Membership on Invite Acceptance?

```
Owner: OnboardingService.acceptInvite()

Flow:
  PENDING membership row (created when invite was sent)
      │
      ▼
  UPDATE memberships SET status = ACTIVE    ← step 6
  UPDATE invitations SET status = ACCEPTED  ← step 7
      │
      ▼
  Both updates run inside a single DB transaction.
  If either fails → both are rolled back.
```
