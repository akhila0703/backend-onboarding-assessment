// Organisation Onboarding

Enum org_type_enum {
  PUC
  School
  BCA
  MCA
}

Enum role_enum {
  Admin
  Staff
}

Enum membership_status_enum {
  PENDING
  ACTIVE
}

Enum invitation_status_enum {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

// ─── TABLE: organisations ───────────────────
Table organisations {
  id          uuid          [pk, default: `gen_random_uuid()`]
  name        varchar(255)  [not null]
  org_code    varchar(50)   [not null, unique, note: 'Short unique ID e.g. PUC-001']
  org_type    org_type_enum [not null, note: 'One of: PUC, School, BCA, MCA']
  created_at  timestamptz   [not null, default: `now()`]
  updated_at  timestamptz   [not null, default: `now()`]
  created_by  uuid          [null, note: 'FK to users. Nullable for bootstrap.']

  indexes {
    org_code [unique, name: "uq_organisations_org_code"]
    org_type [name: "idx_organisations_org_type"]
  }

  Note: 'Stores all organisations. org_type is DB-enforced enum. org_code is globally unique.'
}

// ─── TABLE: users ────────────────────────────
Table users {
  id            uuid         [pk, default: `gen_random_uuid()`]
  email         varchar(255) [not null, unique, note: 'Canonical identity. Globally unique.']
  full_name     varchar(255) [not null]
  password_hash text         [not null, note: 'Argon2/bcrypt hash. Never plaintext.']
  created_at    timestamptz  [not null, default: `now()`]
  updated_at    timestamptz  [not null, default: `now()`]

  indexes {
    email [unique, name: "uq_users_email"]
  }

  Note: 'Registered users. Password stored as hash only.'
}

// ─── TABLE: memberships ──────────────────────
Table memberships {
  id          uuid                   [pk, default: `gen_random_uuid()`]
  user_id     uuid                   [not null, note: 'FK to users. ON DELETE CASCADE']
  org_id      uuid                   [not null, note: 'FK to organisations. ON DELETE CASCADE']
  role        role_enum              [not null, note: 'Admin or Staff']
  status      membership_status_enum [not null, default: 'PENDING', note: 'PENDING on invite, ACTIVE on acceptance']
  created_at  timestamptz            [not null, default: `now()`]
  updated_at  timestamptz            [not null, default: `now()`]

  indexes {
    (user_id, org_id) [unique, name: "uq_memberships_user_org"]
    (org_id, status) [name: "idx_memberships_org_status"]
  }

  Note: 'Join table for users and organisations. UNIQUE(user_id, org_id) prevents duplicates.'
}

// ─── TABLE: invitations ──────────────────────
Table invitations {
  id          uuid                   [pk, default: `gen_random_uuid()`]
  org_id      uuid                   [not null, note: 'FK to organisations. ON DELETE CASCADE']
  invited_by  uuid                   [not null, note: 'FK to users (Admin who sent invite).']
  email       varchar(255)           [not null, note: 'Invitee email address']
  role        role_enum              [not null, default: 'Staff', note: 'Role assigned on acceptance']
  token       varchar(255)           [not null, unique, note: 'Random 32-byte hex. Used in acceptance URL.']
  status      invitation_status_enum [not null, default: 'PENDING']
  expires_at  timestamptz            [not null, note: 'now() + 7 days at creation']
  created_at  timestamptz            [not null, default: `now()`]
  updated_at  timestamptz            [not null, default: `now()`]

  indexes {
    token [unique, name: "uq_invitations_token"]
    (org_id, email) [name: "idx_invitations_org_email"]
    (org_id, status) [name: "idx_invitations_org_status"]
    expires_at [name: "idx_invitations_expires_at"]
  }

  Note: 'Token-based invitations. One PENDING invite per (org_id, email). invited_by is audit trail.'
}

// ─── RELATIONSHIPS ───────────────────────────
Ref: memberships.user_id > users.id
Ref: memberships.org_id > organisations.id
Ref: invitations.org_id > organisations.id
Ref: invitations.invited_by > users.id
Ref: organisations.created_by > users.id
