# Security Specification: EMBER Fitness Records

## 1. Data Invariants
- Each fitness record belongs strictly to a single authenticated user.
- The path variable `userId` must match `request.auth.uid`.
- A user can only read, list, create, update, or delete their own fitness records under `/users/{userId}/records/{recordId}`.
- Record IDs and keys must be either `profile` or a valid ISO date `YYYY-MM-DD`.
- `userId` and `key` are immutable once created.
- `updatedAt` must be synchronized to `request.time`.

## 2. The Dirty Dozen Attack Payloads & Test Assertions
1. **Unauthenticated Read**: Attempting to read `/users/user123/records/profile` without auth token -> REJECT (PERMISSION_DENIED).
2. **Cross-User Snooping**: User A attempting to read `/users/userB/records/2026-10-06` -> REJECT.
3. **Cross-User List Query**: User A querying the collection `/users/userB/records` -> REJECT.
4. **Identity Spoofing on Create**: User A attempting to create `/users/userA/records/profile` with `userId: "userB"` in payload -> REJECT.
5. **Path / Payload Mismatch**: Creating `/users/userA/records/2026-10-06` with `key: "2026-10-07"` -> REJECT.
6. **Invalid Key Format**: Creating `/users/userA/records/invalid_key` -> REJECT.
7. **Shadow Fields**: Creating `/users/userA/records/profile` with an extra unapproved field `isAdmin: true` -> REJECT.
8. **Owner Hijack on Update**: User A attempting to change `userId` from `"userA"` to `"userB"` on update -> REJECT.
9. **Key Alteration on Update**: User A attempting to change `key` on an existing record -> REJECT.
10. **Client-Spoofed Timestamp**: Providing arbitrary timestamp instead of `request.time` for `updatedAt` -> REJECT.
11. **Malicious Non-Map Value**: Supplying a string or integer instead of map for `value` -> REJECT.
12. **Cross-User Delete**: User A attempting to delete `/users/userB/records/profile` -> REJECT.
