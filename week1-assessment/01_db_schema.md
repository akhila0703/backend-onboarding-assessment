# Organisation Onboarding – Database Schema
This database design supports onboarding users into different types of institutions such as School, PUC, BCA and MCA.  
The schema is designed to support multiple organisations, multiple users and role-based membership inside each organisation.


# 1) USERS TABLE
This table stores all registered users in the system.

Columns:
- id – primary key
- name – user full name (required)
- email – unique email for each user (required)
- password – encrypted password (required)
- created_at – record creation time
- updated_at – record last updated time

Constraints:
- Email must be unique for every user
- Email and password cannot be null


# 2) ORGANISATIONS TABLE
This table stores institution/organisation details.

Columns:
- id – primary key
- name – organisation name (required)
- org_code – unique code for organisation (required)
- type – institution type (School, PUC, BCA, MCA)
- created_at – created timestamp
- updated_at – updated timestamp

Constraints:
- org_code must be unique
- organisation type must be one of: School, PUC, BCA, MCA
- name and type cannot be null



# 3) MEMBERSHIPS TABLE
This table connects users with organisations and represents membership.

A single user can belong to multiple organisations and an organisation can have multiple users.

Columns:
- id – primary key
- user_id – references users.id
- org_id – references organisations.id
- role – role inside organisation (Admin/Staff)
- status – onboarding status (PENDING/ACTIVE)
- created_at – created timestamp
- updated_at – updated timestamp

Constraints:
- user_id must exist in users table
- org_id must exist in organisations table
- combination of user_id and org_id must be unique (no duplicate membership)



# 4) INVITATIONS TABLE
This table manages organisation invitations sent to users.

Columns:
- id – primary key
- email – invited user email
- org_id – organisation reference
- role – role offered (Admin/Staff)
- status – invitation status (PENDING, ACCEPTED, EXPIRED)
- created_at – created timestamp
- updated_at – updated timestamp

Constraints:
- same email cannot receive duplicate invite for same organisation
- org_id must exist in organisations table



# RELATIONSHIP OVERVIEW

- One user can join multiple organisations
- One organisation can contain multiple users
- memberships table acts as a bridge between users and organisations
- organisations can send invitations to multiple users
- invitations convert into memberships once accepted



