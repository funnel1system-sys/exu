# Security Specification & Test Blueprint

This specification defines the strict Attribute-Based Access Control (ABAC) invariants and security requirements for the Digital DC Pass Management System.

## 1. Data Invariants

1. **User Profiling Security**:
   - A user profile (`/users/{userId}`) can only be created by the user itself matching `request.auth.uid`.
   - The user cannot elevate their own role to `"admin"`. Initial roles default to `"user"`.
   - Only established Admins can modify a user's role.
   
2. **DC Pass Access Controls**:
   - Any signed-in user can submit a DC Pass for review.
   - Users can read/list only passes they themselves uploaded (`resource.data.uploadedBy == request.auth.uid`).
   - Admins have read and write privileges for ALL passes.
   - Public users can ONLY read individual passes for validation if they access them explicitly via their ID, and they are forbidden from listing or querying the whole collection.
   - Once a DC Pass status is updated to approved or rejected (terminal state), regular users cannot edit its fields or delete it.

3. **Audit Trails & Security Logs**:
   - Audit logs (`/logs/{logId}`) are write-only for authenticated contributors or automated routines, and read-only for admins. They cannot be edited or deleted by anyone once written.

---

## 2. The "Dirty Dozen" Threat Payloads

The following malicious payloads must be blocked by the Firestore rules (`PERMISSION_DENIED`):

| ID | Title | Intended Attack Payload / Action | Expected Result |
|---|---|---|---|
| T1 | Hostile Profile Creation | Register profile with `uid: "victim123"` using attacker account. | `PERMISSION_DENIED` |
| T2 | Self-Privilege Escalation | Send update profile `role: "admin"` on own profile. | `PERMISSION_DENIED` |
| T3 | Rogue Admin Access | Query `get` other user's private details as standard user. | `PERMISSION_DENIED` |
| T4 | Ghost Pass Insertion | Upload pass setting `uploadedBy: "victim_user"`. | `PERMISSION_DENIED` |
| T5 | Pass Interception | Fetch `get` pass uploaded by another standard user. | `PERMISSION_DENIED` |
| T6 | Rogue Pass Scrape | Query `list` entire `passes` collection as standard user. | `PERMISSION_DENIED` |
| T7 | Self-Approve Pass | Standard user attempts `update` pass state `status: "Approved"`. | `PERMISSION_DENIED` |
| T8 | Terminal Override | Standard user tries to force changes on a pass that is already "Approved". | `PERMISSION_DENIED` |
| T9 | Giant ID Resource Exploit | Create pass with a 2MB generated gibberish document ID. | `PERMISSION_DENIED` |
| T10| Unauthorized Log Clear | User attempts `delete` on an /logs document. | `PERMISSION_DENIED` |
| T11| Client-Side System Hack | Regular user modifies system notes or verified count fields. | `PERMISSION_DENIED` |
| T12| Timings Impersonation | Set `createdAt` to a manual client-side past timestamp. | `PERMISSION_DENIED` |

---

## 3. Threat Penetration Verification

We will draft the rules in `firestore.rules` and verify them comprehensively to ensure all twelve payloads are blocked, protecting the system against identity spoofing, value poisoning, and denial-of-wallet attacks.
