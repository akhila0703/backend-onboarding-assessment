# Controller and Service Design (High Level)
It describes how the onboarding system would be structured in a NestJS-style backend architecture.  
The design follows clean separation of concerns with thin controllers and business logic handled inside services.


## CONTROLLERS
Controllers are responsible for handling HTTP requests and sending responses.
They should remain thin and delegate logic to services.

### 1. OrganisationsController
# Responsibilities:
- Create organisation
- Get organisation members

Endpoints handled:
- POST /organisations
- GET /organisations/{id}/members

Calls:
- OrganisationsService



### 2. UsersController
# Responsibilities:
- Create/register user

Endpoints handled:
- POST /users

Calls:
- UsersService



### 3. OnboardingController
# Responsibilities:
- Invite user to organisation
- Accept invitation
- Activate membership

Endpoints handled:
- POST /organisations/{id}/invite
- POST /invitations/accept

Calls:
- OnboardingService



## SERVICES
services contain the business logic and interact with database/repositories.

### OrganisationsService
Handles:
- Creating organisation
- Checking duplicate org_code
- Fetching organisation members list

Example methods:
- createOrganisation()
- getOrganisationMembers()



### UsersService
Handles:
- Creating new user
- Checking existing email
- Fetching user details

Example methods:
- createUser()
- findUserByEmail()



### OnboardingService
Handles:
- Sending invitation
- Checking duplicate invite (idempotency)
- Accepting invitation
- Creating membership
- Updating membership status

Example methods:
- inviteUser()
- acceptInvitation()
- createMembership()



## VALIDATION RESPONSIBILITY

- Basic request validation handled using DTOs (Data Transfer Objects)
- Business validations handled inside services
- Example:
  - Check organisation exists
  - Check user exists
  - Prevent duplicate membership
  - Prevent duplicate invitations



## DATABASE ACCESS
Database access should be handled through repository layer or ORM.

Services interact with:
- User repository
- Organisation repository
- Membership repository
- Invitation repository

Controllers should never directly access database.



## DESIGN PRINCIPLES FOLLOWED

- Thin controllers
- Clear separation of concerns
- Service-based business logic
- Predictable API behaviour
- Idempotent onboarding flow
- Scalable and maintainable structure
