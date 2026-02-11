(Improved API contracts with auth rules, status codes and token-based invite flow)

# API CONTRACT DESIGN – Organisation Onboarding System
This document defines the API endpoints required for onboarding users into an organisation.  
The APIs are designed with predictable behaviour, clear request/response structure and proper error handling.

## 1. CREATE ORGANISATION

Endpoint:
POST /api/organisations

Description:
Creates a new organisation (School, PUC, BCA or MCA).

Request Body (JSON):
{
  "name": "ABC College",
  "org_code": "ABC001",
  "type": "BCA"
}

Success Response (201):
{
  "message": "Organisation created successfully",
  "data": {
    "org_id": "101",
    "name": "ABC College",
    "type": "BCA"
  }
}

Error Responses:
400 – Invalid input  
409 – Organisation with same org_code already exists  
500 – Server error



## 2. CREATE USER

Endpoint:
POST /api/users

Description:
Registers a new user in the system.

Request Body:
{
  "name": "Akhila",
  "email": "akhila@email.com",
  "password": "secure123"
}

Success Response (201):
{
  "message": "User created successfully",
  "data": {
    "user_id": "501",
    "email": "akhila@email.com"
  }
}

Error Responses:
400 – Invalid data  
409 – Email already exists  
500 – Server error



## 3. INVITE USER TO ORGANISATION (updated)

POST /api/v1/organisations/{orgId}/invite

Description:
Invite a user to organisation by admin only.

Auth:
Required (Admin of organisation)

Request body:
{
  email: string,
  role: 'Admin' | 'Staff'
}

Success:
201 Created

Errors:
401 Unauthorized – if user not logged in
403 Forbidden – if not organisation admin
404 Not found – if organisation does not exist
409 Conflict – if active invite already exists


# Idempotency:
(Sending invite multiple times should not create duplicate invitations.)


## 4. ACCEPT INVITATION (updated)

POST /api/v1/invitations/accept?token=invite_token

Description:
Accept organisation invitation using secure token.

Auth:
User must be logged in.

Success:
200 OK → membership created

Errors:
400 Bad request – invalid token
401 Unauthorized – not logged in
404 Not found – invite not found
410 Gone – invite expired
409 Conflict – already member


## 5. GET ORGANISATION MEMBERS (updated)

GET /api/v1/organisations/{orgId}/members

Description:
Fetch all members of an organisation.

Auth:
Required (Only Admin of organisation can view members)

Path Params:
orgId: uuid

Success Response:
200 OK

Response body:
[
  
  {
    user_id: uuid,
    name: string,
    email: string,
    role: 'Admin' | 'Staff',
    status: 'ACTIVE'
  }
]

Error Responses:
401 Unauthorized – user not logged in
403 Forbidden – user not admin of organisation
404 Not Found – organisation does not exist
500 Internal Server Error – server issue




## STANDARD ERROR FORMAT

All APIs follow consistent error structure:

{
  "error": true,
  "message": "Error description",
  "status_code": 400
}
