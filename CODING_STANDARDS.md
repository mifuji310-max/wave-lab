# Coding Standards

## TypeScript

- Enable strict type checking.
- Avoid `any`; explain exceptional uses.
- Use discriminated unions for Worker messages and source types.
- Validate data at runtime at trust boundaries.
- Prefer pure functions in physics and data transformation code.
- Keep React imports out of the physics module.

## Naming

- Use domain names: `waveSpeed`, `observer`, `boundary`.
- Include units in names when values have physical units, such as `timeStepSeconds`.
- Do not use screen-pixel coordinates as simulation coordinates.

## Components

- Keep components focused.
- Move numerical work out of React render paths.
- Provide labels for controls.
- Avoid global mutable state.

## Comments

Comments explain why, assumptions, units, and numerical constraints. They should not merely restate code.

## Commits

Use concise imperative messages, for example:

- `Add project requirements`
- `Implement pulse source prototype`
- `Validate solver stability`

## Pull requests

Each pull request should be small enough to review and must link to an issue where practical.
