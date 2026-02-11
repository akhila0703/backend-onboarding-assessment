(Updated flow diagram with explicit DB reads/writes and membership lifecycle)

---
config:
  layout: dagre
---
flowchart TB

A[Admin creates organisation API]
A --> A1[WRITE organisations table]

A1 --> B[Admin creates user API]
B --> B1[READ users table]
B1 -->|if not exists| B2[WRITE users table]

B2 --> C[Admin invites user]
C --> C1[READ organisations table]
C1 --> C2[READ invitations table]
C2 -->|no active invite| C3[WRITE invitations table with token & expiry]

C3 --> D[User receives invite link with token]

D --> E[User accepts invite API with token]
E --> E1[READ invitations table by token]
E1 -->|valid & not expired| E2[READ memberships table]

E2 -->|not member| F[WRITE memberships table status=PENDING]
F --> G[UPDATE membership status ACTIVE]

G --> H[User successfully onboarded]

H --> I[Admin fetch members list]
I --> I1[READ memberships table]
I1 --> I2[READ users table]
I2 --> J[Return organisation members list]


    style R fill:#BBDEFB
