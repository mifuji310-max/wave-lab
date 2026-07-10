# Project Charter

## Project name

Wave Lab

## Purpose

Wave Lab provides a smartphone-based environment in which learners can generate, observe, measure, and compare waves.

The product is intended to help learners form a correct mental model before introducing formal equations.

## Primary user

Middle-school students using a smartphone independently or during a science lesson.

## Secondary users

- Science teachers demonstrating wave phenomena
- Parents supporting home learning
- High-school students reviewing foundational concepts

## Core learning cycle

1. Predict
2. Change a condition
3. Run the experiment
4. Observe the result
5. Measure at a selected point
6. Explain the difference

## v0.1 scope

- Basic wave behavior
- Reflection
- Single-slit diffraction
- Two-source interference
- Guided lessons
- Free experiment
- 2D color and monochrome views
- 2.5D height view
- One observation point
- Bottom-sheet observation panel
- Play, pause, step, and speed controls
- Simple local experiment notes

## Out of scope for v0.1

- Doppler effect
- Audio playback
- Microphone input
- Light-specific electromagnetic simulation
- Cloud synchronization
- User accounts
- AI teacher
- Collaborative experiments
- Fully three-dimensional wave simulation

## Success criteria

The v0.1 release succeeds when:

- A learner can create a wave within three seconds of opening an experiment.
- Reflection, diffraction, and interference arise from the solver rather than visual scripting.
- The interface remains usable in portrait and landscape orientation.
- The standard quality setting runs interactively on the agreed target Android devices.
- An observation point displays a stable time-history graph.
- Physics validation results are documented.
- A middle-school learner can complete each guided lesson without external instructions.

## Product constraints

- Mobile browsers are the primary runtime.
- Touch controls must not depend on hover.
- Essential learning must not depend on color alone.
- Advanced terminology and equations remain behind a “Learn more” action.
- Performance degradation must reduce quality gracefully rather than freeze the interface.

## Decision authority

The repository owner approves:

- v0.1 scope changes
- educational wording
- public release
- licensing
- collection or storage of user data

Technical changes may be implemented only when they do not silently change the approved learning behavior or physical model.
