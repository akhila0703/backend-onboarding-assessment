# 04 — Controller & Service Design (NestJS)

## Architecture Overview

```
HTTP Request
    │
    ▼
Controller  ← validates request shape via DTOs + ValidationPipe
    │
    ▼
Service     ← owns all business logic and conflict checks
    │
    ▼
Repository  ← all DB access (TypeORM / Prisma); no business logic
```

**Principles:**
- Controllers are thin: they receive a request, call one service method, and return the result.
- Services own all business rules: conflict checks, authorization rules, state transitions.
- DTOs (Data Transfer Objects) enforce shape and type at the HTTP boundary via `class-validator`.
- The repository/ORM layer is the only place DB queries run.

---

## Module Structure

```
src/
├── organisations/
│   ├── organisations.controller.ts
│   ├── organisations.service.ts
│   └── dto/
│       ├── create-organisation.dto.ts
│       └── list-members-query.dto.ts
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       └── create-user.dto.ts
├── onboarding/
│   ├── onboarding.controller.ts
│   ├── onboarding.service.ts
│   └── dto/
│       ├── invite-user.dto.ts
│       └── accept-invite.dto.ts
└── auth/
    └── guards/
        └── jwt-auth.guard.ts   ← used on protected endpoints
```

---

## 1. Organisations Module

### `OrganisationsController`

**Responsibility:** Handle HTTP for org creation and member listing. Enforce auth guard on protected routes.

```typescript
@Controller('organisations')
export class OrganisationsController {

  constructor(private readonly organisationsService: OrganisationsService) {}

  /**
   * POST /organisations
   * No auth required.
   * Validates body via CreateOrganisationDto.
   */
  @Post()
  async create(
    @Body() dto: CreateOrganisationDto
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.createOrganisation(dto);
    // Returns 201 on success; service throws ConflictException on duplicate orgCode
  }

  /**
   * GET /organisations/:orgId/members
   * Auth required (JwtAuthGuard).
   * Caller must be an active member of the org.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':orgId/members')
  async getMembers(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() callerId: string,
    @Query() query: ListMembersQueryDto
  ): Promise<MembersListResponseDto> {
    return this.organisationsService.getMembers(orgId, callerId, query);
    // Service checks: org exists, caller is active member
  }
}
```

### `OrganisationsService`

**Responsibility:** Business logic for org creation and member retrieval.

```typescript
@Injectable()
export class OrganisationsService {

  constructor(
    @InjectRepository(Organisation)
    private readonly orgRepo: Repository<Organisation>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
  ) {}

  /**
   * Creates a new organisation.
   * Throws ConflictException if orgCode already exists.
   * @param dto CreateOrganisationDto
   * @returns OrganisationResponseDto
   */
  async createOrganisation(dto: CreateOrganisationDto): Promise<OrganisationResponseDto> {
    // 1. READ organisations: check orgCode uniqueness
    const existing = await this.orgRepo.findOne({ where: { orgCode: dto.orgCode } });
    if (existing) {
      throw new ConflictException({ code: 'ORG_CODE_CONFLICT', message: `Org code '${dto.orgCode}' already exists.` });
    }
    // 2. WRITE organisations: insert new row
    const org = this.orgRepo.create(dto);
    const saved = await this.orgRepo.save(org);
    return toOrganisationResponseDto(saved);
  }

  /**
   * Returns ACTIVE members of an organisation.
   * Throws NotFoundException if org not found.
   * Throws ForbiddenException if caller is not an active member.
   * @param orgId  UUID of the organisation
   * @param callerId UUID of the requesting user
   * @param query  Optional filters (role, status)
   * @returns MembersListResponseDto
   */
  async getMembers(
    orgId: string,
    callerId: string,
    query: ListMembersQueryDto
  ): Promise<MembersListResponseDto> {
    // 1. READ organisations: verify org exists
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException({ code: 'ORG_NOT_FOUND', message: 'Organisation not found.' });

    // 2. READ memberships: verify caller is active member
    const callerMembership = await this.membershipRepo.findOne({
      where: { orgId, userId: callerId, status: MembershipStatus.ACTIVE }
    });
    if (!callerMembership) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You must be a member of this organisation.' });

    // 3. READ memberships + users JOIN: fetch member list with optional filters
    const members = await this.membershipRepo.find({
      where: { orgId, ...(query.role && { role: query.role }), ...(query.status && { status: query.status }) },
      relations: ['user'],
    });
    return toMembersListResponseDto(orgId, members);
  }
}
```

---

## 2. Users Module

### `UsersController`

**Responsibility:** Handle HTTP for user registration only.

```typescript
@Controller('users')
export class UsersController {

  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * No auth required.
   * Validates body via CreateUserDto.
   */
  @Post()
  async create(
    @Body() dto: CreateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.createUser(dto);
    // Returns 201 on success; service throws ConflictException on duplicate email
  }
}
```

### `UsersService`

**Responsibility:** User creation and lookup.

```typescript
@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Creates a new user.
   * Hashes password before storing.
   * Throws ConflictException if email already exists.
   * @param dto CreateUserDto
   * @returns UserResponseDto (no password field)
   */
  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    // 1. READ users: check email uniqueness
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_CONFLICT', message: `Email '${dto.email}' is already registered.` });
    }
    // 2. Hash password
    const passwordHash = await argon2.hash(dto.password);
    // 3. WRITE users: insert new row
    const user = this.userRepo.create({ ...dto, passwordHash });
    const saved = await this.userRepo.save(user);
    return toUserResponseDto(saved); // strips passwordHash from response
  }

  /**
   * Finds a user by ID.
   * Throws NotFoundException if not found.
   * @param userId UUID
   * @returns User entity
   */
  async findById(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found.' });
    return user;
  }
}
```

---

## 3. Onboarding Module

### `OnboardingController`

**Responsibility:** Handle HTTP for invite sending and invite acceptance. Invite sending is auth-protected; invite acceptance uses token-based auth only.

```typescript
@Controller()
export class OnboardingController {

  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * POST /organisations/:orgId/invitations
   * Auth required. Caller must be Admin of org.
   * Validates body via InviteUserDto.
   */
  @UseGuards(JwtAuthGuard)
  @Post('organisations/:orgId/invitations')
  async inviteUser(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @CurrentUser() callerId: string,
    @Body() dto: InviteUserDto
  ): Promise<InvitationResponseDto> {
    return this.onboardingService.inviteUser(orgId, callerId, dto);
  }

  /**
   * POST /invitations/:token/accept
   * No JWT required — token in URL is the auth mechanism.
   * Validates body via AcceptInviteDto.
   */
  @Post('invitations/:token/accept')
  async acceptInvite(
    @Param('token') token: string,
    @Body() dto: AcceptInviteDto
  ): Promise<MembershipResponseDto> {
    return this.onboardingService.acceptInvite(token, dto);
  }
}
```

### `OnboardingService`

**Responsibility:** All invite and membership business logic including role checks, conflict checks, token generation, and state transitions.

```typescript
@Injectable()
export class OnboardingService {

  constructor(
    @InjectRepository(Organisation)
    private readonly orgRepo: Repository<Organisation>,
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Sends an invitation to an email address to join an org.
   * Business rules checked:
   *   - Caller must be an Admin of the org (403 if not)
   *   - Org must exist (404 if not)
   *   - Invitee must not already be an ACTIVE member (409)
   *   - No PENDING invite for same org+email must exist (409)
   * Side effects:
   *   - W: invitations (INSERT)
   *   - W: memberships (INSERT with status=PENDING)
   * @param orgId    UUID of the organisation
   * @param callerId UUID of the inviting user (must be Admin)
   * @param dto      InviteUserDto { email, role }
   * @returns InvitationResponseDto
   */
  async inviteUser(
    orgId: string,
    callerId: string,
    dto: InviteUserDto
  ): Promise<InvitationResponseDto> {
    // 1. READ memberships: verify caller is Admin
    const callerMembership = await this.membershipRepo.findOne({
      where: { orgId, userId: callerId, status: MembershipStatus.ACTIVE }
    });
    if (!callerMembership || callerMembership.role !== Role.Admin) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Only an Admin of this organisation can send invitations.' });
    }

    // 2. READ organisations: verify org exists
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException({ code: 'ORG_NOT_FOUND', message: 'Organisation not found.' });

    // 3. READ users + memberships: check if invitee is already an ACTIVE member
    const inviteeUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (inviteeUser) {
      const existingMembership = await this.membershipRepo.findOne({
        where: { orgId, userId: inviteeUser.id, status: MembershipStatus.ACTIVE }
      });
      if (existingMembership) {
        throw new ConflictException({ code: 'ALREADY_A_MEMBER', message: 'This user is already an active member.' });
      }
    }

    // 4. READ invitations: check for duplicate PENDING invite
    const existingInvite = await this.invitationRepo.findOne({
      where: { orgId, email: dto.email, status: InvitationStatus.PENDING }
    });
    if (existingInvite) {
      throw new ConflictException({ code: 'INVITE_ALREADY_PENDING', message: 'A pending invitation already exists for this email.' });
    }

    // 5. Generate token and expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // 6. WRITE invitations: insert invite row
    const invitation = await this.invitationRepo.save(
      this.invitationRepo.create({
        orgId, email: dto.email, role: dto.role,
        invitedBy: callerId, token, expiresAt,
        status: InvitationStatus.PENDING,
      })
    );

    // 7. WRITE memberships: insert pending membership
    await this.membershipRepo.save(
      this.membershipRepo.create({
        orgId,
        userId: inviteeUser?.id ?? null, // null if user not yet registered
        role: dto.role,
        status: MembershipStatus.PENDING,
      })
    );

    // 8. (Async) Send invite email with token — delegated to a MailService
    // await this.mailService.sendInviteEmail(dto.email, token, org.name);

    return toInvitationResponseDto(invitation); // token NOT included in response
  }

  /**
   * Accepts an invitation by token, activating the membership.
   * Business rules checked:
   *   - Token must exist (404 if not)
   *   - Invite must be PENDING (409 if not)
   *   - Invite must not be expired (409 if expired)
   *   - userId must exist and email must match invite email (400 if mismatch)
   *   - User must not already be an ACTIVE member (409)
   * State transitions:
   *   - W: invitations UPDATE status = ACCEPTED
   *   - W: memberships UPDATE status = ACTIVE (or INSERT if no PENDING row)
   * @param token  Invite token from URL
   * @param dto    AcceptInviteDto { userId }
   * @returns MembershipResponseDto
   */
  async acceptInvite(token: string, dto: AcceptInviteDto): Promise<MembershipResponseDto> {
    // 1. READ invitations: find by token
    const invitation = await this.invitationRepo.findOne({ where: { token } });
    if (!invitation) throw new NotFoundException({ code: 'INVITE_NOT_FOUND', message: 'No invitation found for this token.' });

    // 2. Check invite status
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ConflictException({ code: 'INVITE_NOT_PENDING', message: `Invitation is already ${invitation.status.toLowerCase()}.`, details: { currentStatus: invitation.status } });
    }

    // 3. Check expiry — if expired, update status and throw
    if (new Date() > invitation.expiresAt) {
      await this.invitationRepo.update(invitation.id, { status: InvitationStatus.EXPIRED });
      throw new ConflictException({ code: 'INVITE_EXPIRED', message: `This invitation expired on ${invitation.expiresAt.toISOString()}.` });
    }

    // 4. READ users: verify userId exists and email matches invite
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found.' });
    if (user.email !== invitation.email) {
      throw new BadRequestException({ code: 'EMAIL_MISMATCH', message: 'This invitation was not issued to your email address.' });
    }

    // 5. READ memberships: check for existing ACTIVE membership
    const activeMembership = await this.membershipRepo.findOne({
      where: { orgId: invitation.orgId, userId: user.id, status: MembershipStatus.ACTIVE }
    });
    if (activeMembership) {
      throw new ConflictException({ code: 'ALREADY_A_MEMBER', message: 'You are already an active member of this organisation.' });
    }

    // 6. READ memberships: find existing PENDING membership to update, or create new
    let membership = await this.membershipRepo.findOne({
      where: { orgId: invitation.orgId, userId: user.id, status: MembershipStatus.PENDING }
    });
    if (membership) {
      // WRITE memberships: UPDATE existing PENDING → ACTIVE
      await this.membershipRepo.update(membership.id, { status: MembershipStatus.ACTIVE, userId: user.id });
      membership.status = MembershipStatus.ACTIVE;
    } else {
      // WRITE memberships: INSERT new ACTIVE membership
      membership = await this.membershipRepo.save(
        this.membershipRepo.create({ orgId: invitation.orgId, userId: user.id, role: invitation.role, status: MembershipStatus.ACTIVE })
      );
    }

    // 7. WRITE invitations: UPDATE status = ACCEPTED
    await this.invitationRepo.update(invitation.id, { status: InvitationStatus.ACCEPTED });

    return toMembershipResponseDto(membership);
  }
}
```

---

## 4. DTOs

### `CreateOrganisationDto`
```typescript
export class CreateOrganisationDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @IsString() @IsNotEmpty() @MaxLength(50)
  orgCode: string;

  @IsEnum(OrgType)  // OrgType = 'PUC' | 'School' | 'BCA' | 'MCA'
  orgType: OrgType;
}
```

### `CreateUserDto`
```typescript
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString() @IsNotEmpty() @MaxLength(255)
  fullName: string;

  @IsString() @MinLength(8)
  password: string;
}
```

### `InviteUserDto`
```typescript
export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)  // Role = 'Admin' | 'Staff'
  role: Role;
}
```

### `AcceptInviteDto`
```typescript
export class AcceptInviteDto {
  @IsUUID()
  userId: string;
}
```

### `ListMembersQueryDto`
```typescript
export class ListMembersQueryDto {
  @IsOptional() @IsEnum(Role)
  role?: Role;

  @IsOptional() @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
```

---

## 5. Validation Ownership Boundaries

| Validation Type                              | Owned By                        | Example                                              |
|----------------------------------------------|---------------------------------|------------------------------------------------------|
| Field types, formats, required checks        | **DTO + ValidationPipe**        | `email` is valid email, `orgType` is valid enum      |
| Business conflict checks                     | **Service**                     | orgCode uniqueness, PENDING invite duplication       |
| Authorization / role checks                  | **Service** (after guard)       | caller is Admin of org                               |
| Token authenticity (JWT)                     | **JwtAuthGuard** (NestJS guard) | Bearer token is valid and not expired                |
| Invite token authenticity                    | **Service** (DB lookup)         | token exists in `invitations` table                  |
| DB constraint enforcement (last safety net)  | **Database**                    | `UNIQUE (user_id, org_id)` on `memberships`          |

---

## 6. Who Activates Membership on Invite Acceptance?

**`OnboardingService.acceptInvite()`** owns this responsibility exclusively.

The flow is:
1. Locate the `PENDING` membership row for `(orgId, userId)` created when the invite was sent.
2. `UPDATE memberships SET status = 'ACTIVE'` on that row.
3. `UPDATE invitations SET status = 'ACCEPTED'` on the invite row.

Both updates happen in the same service method. If either fails, neither should persist (wrap in a DB transaction).

```typescript
// Wrap steps 6 and 7 in a transaction for atomicity:
await this.dataSource.transaction(async (manager) => {
  await manager.update(Membership, membership.id, { status: MembershipStatus.ACTIVE });
  await manager.update(Invitation, invitation.id, { status: InvitationStatus.ACCEPTED });
});
```
