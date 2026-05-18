# Security Specification for Poly-Crow

## Data Invariants
1. **User Privacy**: Users can only read and write their own profile data, except for public metadata (reliability score) if needed (though we'll keep it strictly private for now).
2. **Agreement Membership**: Only participants listed in the `participants` array can access an agreement and its sub-collections (messages).
3. **Immutability**: Once an agreement is created, the `stakes`, `participants`, and `createdBy` fields cannot be changed.
4. **Action-Based Updates**:
   - `status` can be changed to 'breached' or 'completed'.
   - `status` is terminal once it reaches 'completed' or 'breached' (except for admin).
5. **Atomic Messages**: Messages must have a valid `senderId` matching the authenticated user.

## The Dirty Dozen Payloads (Targeting PERMISSION_DENIED)
1. **Identity Spoofing (User)**: Authenticated user A tries to update user B's profile.
2. **Identity Spoofing (Agreement)**: User A tries to create an agreement where `createdBy` is User B's UID.
3. **Unauthorized Read**: User A tries to read Agreement X where they are NOT in the `participants` array.
4. **Unauthorized Message**: User A tries to send a message to Agreement X where they are NOT a participant.
5. **Stake Tampering**: Participant A tries to change the `stakes` of an active agreement.
6. **Participant Injection**: Participant A tries to add a new participant to an existing agreement.
7. **Terminal State Bypass**: Participant A tries to change the status from 'completed' back to 'active'.
8. **Shadow Field Injection**: User tries to create an agreement with a hidden `isAdmin: true` field.
9. **Fake Sender**: Participant A tries to send a message with `senderId` set to Participant B's UID.
10. **Notification Theft**: User A tries to read User B's notifications.
11. **Balance Fabrication**: User A tries to directly update their `balance` field (this should be server-side only in a real app, but we'll restrict it to "no user can update balance" or "only specific logic").
12. **Status Shortcut**: User tries to skip 'pending' and go straight to 'completed' without fulfilling criteria (if we had complex state transitions).

## Test Runner (Logic Check)
The tests will ensure that:
- `create` checks exact key size and required fields.
- `update` uses `affectedKeys().hasOnly()`.
- `get/list` enforces participant membership.
