# Controller and Service Design (Implementation-ready)

This section defines controller and service responsibilities with method signatures and validation ownership.


## OrganisationsController

Responsibilities:
- Create organisation
- List organisation members

Methods:
createOrganisation(dto: CreateOrganisationDto): Promise<OrganisationResponse>

getOrganisationMembers(orgId: string): Promise<MemberListResponse>

Calls:
OrganisationsService



## UsersController

Responsibilities:
- Register user

Methods:
createUser(dto: CreateUserDto): Promise<UserResponse>

Calls:
UsersService



## OnboardingController

Responsibilities:
- Invite user to organisation
- Accept invitation via token

Methods:
inviteUser(orgId: string, dto: InviteUserDto): Promise<void>

acceptInvitation(token: string): Promise<MembershipResponse>

Calls:
OnboardingService



## Services

### OrganisationsService

createOrganisation(dto: CreateOrganisationDto): Promise<Organisation>

getMembers(orgId: string): Promise<Member[]>

Validations:
- org_code uniqueness
- organisation exists



### UsersService

createUser(dto: CreateUserDto): Promise<User>

findByEmail(email: string): Promise<User | null>

Validations:
- email uniqueness
- required fields



### OnboardingService

inviteUser(orgId: string, dto: InviteUserDto): Promise<void>

acceptInvite(token: string): Promise<Membership>

activateMembership(userId: string, orgId: string): Promise<void>

Validations:
- admin authorization check
- duplicate invite prevention
- invite expiry check
- membership conflict check



## Validation Ownership

DTO validation:
- request body format
- required fields
- email format

Service-level validation:
- organisation existence
- user existence
- duplicate membership
- invite idempotency
- role authorization



## Database Access Layer

Repositories handle DB interaction:
- UserRepository
- OrganisationRepository
- MembershipRepository
- InvitationRepository

Services call repositories.
Controllers never access database directly.
