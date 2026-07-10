# Security and Privacy

## v0.1 policy

- No user account
- No analytics by default
- No advertising
- No cloud persistence
- No microphone or camera access
- Experiment notes remain on the device unless explicitly exported

## Import safety

Imported experiment files must be treated as untrusted.

Requirements:

- Validate schema and size
- Reject unknown executable content
- Never evaluate imported strings as code
- Limit geometry and source counts
- Display a clear import failure message

## Dependencies

- Keep dependencies minimal.
- Pin versions through the lockfile.
- Review security alerts.
- Avoid packages for trivial utility functions.
- Document any dependency with access to storage, network, or device APIs.

## Future permissions

Features such as microphone input or cloud sharing require a separate privacy review and explicit user permission.
