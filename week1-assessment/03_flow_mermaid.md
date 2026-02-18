(./mermaid-diagram.svg)

flowchart TD
    Start([Start: Onboarding Flow])

    %% ─── STEP 1: Create Organisation ────────────────────────
    Start --> A1[POST /organisations\norgCode, orgType, name]
    A1 --> A2{R: organisations\nDoes org_code already exist?}
    A2 -- Yes --> A_ERR1([409 ORG_CODE_CONFLICT])
    A2 -- No --> A3{Validate orgType\nis PUC / School / BCA / MCA?}
    A3 -- Invalid --> A_ERR2([400 VALIDATION_ERROR])
    A3 -- Valid --> A4[W: organisations\nINSERT new row]
    A4 --> A5([201 Created: Organisation])

    %% ─── STEP 2: Create User ─────────────────────────────────
    A5 --> B1[POST /users\nemail, fullName, password]
    B1 --> B2{R: users\nDoes email already exist?}
    B2 -- Yes --> B_ERR1([409 EMAIL_CONFLICT])
    B2 -- No --> B3[Hash password\nArgon2 / bcrypt]
    B3 --> B4[W: users\nINSERT new row]
    B4 --> B5([201 Created: User])

    %% ─── STEP 3: Invite User ─────────────────────────────────
    B5 --> C1[POST /organisations/:orgId/invitations\nemail, role\nAuthorization: Bearer token]
    C1 --> C2{R: users\nVerify JWT → get callerId}
    C2 -- Invalid/Missing --> C_ERR1([401 UNAUTHORIZED])
    C2 -- Valid --> C3{R: memberships\nIs caller Admin of this org\nstatus = ACTIVE?}
    C3 -- Not Admin --> C_ERR2([403 FORBIDDEN])
    C3 -- Is Admin --> C4{R: organisations\nDoes orgId exist?}
    C4 -- Not Found --> C_ERR3([404 ORG_NOT_FOUND])
    C4 -- Found --> C5{R: memberships\nIs invitee already an ACTIVE member?}
    C5 -- Already Member --> C_ERR4([409 ALREADY_A_MEMBER])
    C5 -- Not a member --> C6{R: invitations\nIs there a PENDING invite\nfor this org_id + email?}
    C6 -- Pending invite exists --> C_ERR5([409 INVITE_ALREADY_PENDING])
    C6 -- No active invite --> C7[Generate crypto-random token\nSet expires_at = now + 7 days]
    C7 --> C8[W: invitations\nINSERT row\nstatus = PENDING]
    C8 --> C9[W: memberships\nINSERT row\nstatus = PENDING]
    C9 --> C10[Send invite email\nwith token link]
    C10 --> C11([201 Created: Invitation])

    %% ─── STEP 4: Accept Invite ───────────────────────────────
    C11 --> D1[POST /invitations/:token/accept\nuserId in body]
    D1 --> D2{R: invitations\nFind invite by token\nDoes it exist?}
    D2 -- Not Found --> D_ERR1([404 INVITE_NOT_FOUND])
    D2 -- Found --> D3{Is status = PENDING?}
    D3 -- ACCEPTED / EXPIRED / REVOKED --> D_ERR2([409 INVITE_NOT_PENDING])
    D3 -- PENDING --> D4{Is now > expires_at?}
    D4 -- Expired --> D5[W: invitations\nUPDATE status = EXPIRED]
    D5 --> D_ERR3([409 INVITE_EXPIRED])
    D4 -- Not expired --> D6{R: users\nDoes userId exist?\nDoes user email match invite email?}
    D6 -- User not found --> D_ERR4([404 USER_NOT_FOUND])
    D6 -- Email mismatch --> D_ERR5([400 EMAIL_MISMATCH])
    D6 -- Matches --> D7{R: memberships\nDoes a PENDING membership exist\nfor this user + org?}
    D7 -- PENDING found --> D8[W: memberships\nUPDATE status = ACTIVE\nupdated_at = now]
    D7 -- No membership row --> D9[W: memberships\nINSERT new row\nstatus = ACTIVE]
    D8 --> D10[W: invitations\nUPDATE status = ACCEPTED\nupdated_at = now]
    D9 --> D10
    D10 --> D11([200 OK: Membership ACTIVE])

    %% ─── STEP 5: List Members ────────────────────────────────
    D11 --> E1[GET /organisations/:orgId/members\nAuthorization: Bearer token]
    E1 --> E2{R: users\nVerify JWT → get callerId}
    E2 -- Invalid/Missing --> E_ERR1([401 UNAUTHORIZED])
    E2 -- Valid --> E3{R: organisations\nDoes orgId exist?}
    E3 -- Not Found --> E_ERR2([404 ORG_NOT_FOUND])
    E3 -- Found --> E4{R: memberships\nIs caller an ACTIVE member\nof this org?}
    E4 -- Not a member --> E_ERR3([403 FORBIDDEN])
    E4 -- Is member --> E5[R: memberships + users\nJOIN on user_id\nWHERE org_id = orgId]
    E5 --> E6([200 OK: Members List])
