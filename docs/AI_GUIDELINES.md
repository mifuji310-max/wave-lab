# AI Development Guidelines

These instructions apply to AI-assisted design and implementation.

## Before coding

1. Read the project charter.
2. Read the relevant requirements and architecture documents.
3. Identify ambiguities.
4. Propose the smallest change that satisfies the requirement.
5. Update documentation when behavior or design changes.

## Required behavior

- Do not invent approved requirements.
- Do not silently broaden v0.1 scope.
- Do not substitute a visual effect for physical computation.
- Do not claim physical accuracy without a validation result.
- Do not add a dependency without explaining its purpose.
- Do not add telemetry, accounts, network calls, or permissions without approval.
- Preserve mobile touch usability.
- Include tests for numerical and serialization changes.

## Code output

For each implementation change, provide:

- Files changed
- Reason for change
- Assumptions
- Test method
- Known limitations
- Follow-up issue when needed

## Physics changes

Any change to solver equations, boundary conditions, source injection, damping, units, or phase calculation requires:

- Documentation update
- Validation case
- Before/after explanation
- Architecture decision record when the change is material

## Educational content

Use middle-school language first. Put equations and advanced terminology behind an optional explanation.
