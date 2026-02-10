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



## 3. INVITE USER TO ORGANISATION

Endpoint:
POST /api/organisations/{org_id}/invite

Description:
Invites a user to join an organisation.

Request Body:
{
  "email": "staff@email.com",
  "role": "Staff"
}

Success Response (200):
{
  "message": "Invitation sent successfully"
}

Error Responses:
404 – Organisation not found  
409 – User already invited or already member  
400 – Invalid email  
500 – Server error

# Idempotency:
(Sending invite multiple times should not create duplicate invitations.)


## 4. ACCEPT INVITATION

Endpoint:
POST /api/invitations/accept

Description:
User accepts organisation invitation and becomes member.

Request Body:
{
  "email": "staff@email.com",
  "org_id": "101"
}

Success Response (200):
{
  "message": "Membership activated successfully"
}

Error Responses:
404 – Invitation not found  
409 – Already member  
400 – Invalid request  
500 – Server error



## 5. GET ORGANISATION MEMBERS

Endpoint:
GET /api/organisations/{org_id}/members

Description:
Fetch all members of an organisation.

Success Response (200):
{
  "organisation": "ABC College",
  "members": [
  
  {
      "name": "Akhila",
      "email": "akhila@email.com",
      "role": "Admin",
      "status": "ACTIVE"
    }
  ]
}

Error Responses:
404 – Organisation not found  
500 – Server error



## STANDARD ERROR FORMAT

All APIs follow consistent error structure:

{
  "error": true,
  "message": "Error description",
  "status_code": 400
}
