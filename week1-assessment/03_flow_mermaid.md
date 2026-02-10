---
config:
  layout: dagre
---
flowchart TB
    A["Create Org"] --> B{"Valid details?"}
    B -- No --> B1["Rtrn error"]
    B -- Yes --> C["Save in organisations table"]
    C --> D["User"]
    D --> E{"User already exists?"}
    E -- Yes --> E1["Rtrn conflict"]
    E -- No --> F["Save in users table"]
    F --> G["Invite User to Org"]
    G --> H{"Organisation exists?"}
    H -- No --> H1["org not found"]
    H -- Yes --> I{"Invite already exists?"}
    I -- Yes --> I1["Rtrn dup invite"]
    I -- No --> J["Save in invitations table"]
    J --> K["User accepts invite"]
    K --> L{"Invite valid?"}
    L -- No --> L1["Return invalid invite"]
    L -- Yes --> M["Create member"]
    M --> N["Update membership ACTIVE"]
    N --> O["User onboarded"]
    O --> P["Get org members"]
    P --> Q["Fetch from memberships table"]
    Q --> R["Return members list"]

    style A fill:#BBDEFB
    style B fill:#FFF9C4
    style B1 fill:#FFCDD2
    style C fill:#C8E6C9
    style D fill:#BBDEFB
    style E fill:#FFF9C4
    style E1 fill:#FFCDD2
    style F fill:#C8E6C9
    style G fill:#BBDEFB
    style H fill:#FFF9C4
    style H1 fill:#FFCDD2
    style I fill:#FFF9C4
    style I1 fill:#FFCDD2
    style J fill:#C8E6C9
    style K fill:#BBDEFB
    style L fill:#FFF9C4
    style L1 fill:#FFCDD2
    style M fill:#C8E6C9
    style N fill:#E1BEE7
    style O fill:#E1BEE7
    style P fill:#E1BEE7
    style Q fill:#E1BEE7
    style R fill:#BBDEFB
