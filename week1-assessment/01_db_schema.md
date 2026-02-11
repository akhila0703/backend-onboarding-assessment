(Updated DB schema with implementation-level fields, constraints and nullability)

# Organisation Onboarding – Database Schema
This database design supports onboarding users into different types of institutions such as School, PUC, BCA and MCA.  
The schema is designed to support multiple organisations, multiple users and role-based membership inside each organisation.


# 1) USERS TABLE
This table stores all registered users in the system.

id: uuid (primary key)
name: varchar(100) not null
email: varchar(255) unique not null
password_hash: varchar(255) not null
created_at: timestamptz default now()
updated_at: timestamptz default now()


Constraints:
- Email must be unique for every user
- Email and password cannot be null


# 2) ORGANISATIONS TABLE
This table stores institution/organisation details.

id: uuid primary key
name: varchar(150) not null
org_code: varchar(50) unique not null
org_type: varchar(20) not null check (org_type in ('School','PUC','BCA','MCA'))
created_at: timestamptz default now()
updated_at: timestamptz default now()


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
- unique(user_id, org_id)
- status: varchar(20) default 'PENDING'

Constraints:
- user_id must exist in users table
- org_id must exist in organisations table
- combination of user_id and org_id must be unique (no duplicate membership)



# 4) INVITATIONS TABLE
This table manages organisation invitations sent to users.

id: uuid primary key
org_id: uuid references organisations(id) on delete cascade
email: varchar(255) not null
role: varchar(20) check (role in ('Admin','Staff'))
invite_token: varchar(255) unique not null
expires_at: timestamptz not null
status: varchar(20) default 'PENDING'
invited_by: uuid references users(id)
created_at: timestamptz default now()

unique(org_id, email, status)


Constraints:
- same email cannot receive duplicate invite for same organisation
- org_id must exist in organisations table



# RELATIONSHIP OVERVIEW

- One user can join multiple organisations
- One organisation can contain multiple users
- memberships table acts as a bridge between users and organisations
- organisations can send invitations to multiple users
- invitations convert into memberships once accepted



