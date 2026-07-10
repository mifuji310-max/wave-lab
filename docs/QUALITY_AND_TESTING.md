# Quality and Testing

## Test layers

### Unit tests

- Numerical update functions
- Parameter validation
- Coordinate transforms
- Serialization and migrations
- Observation calculations

### Integration tests

- Main thread to Worker messages
- Solver snapshot to renderer
- Rotation without state loss
- IndexedDB save and restore

### Visual tests

- Reference scenes for reflection, diffraction, and interference
- UI at representative portrait and landscape sizes
- Color and monochrome legends

### Device tests

At minimum, record results for:

- One recent Android phone
- One mid-range Android phone
- One lower-performance supported Android phone
- Desktop Chromium for development

Exact supported devices will be chosen after the prototype.

## Performance metrics

Collect:

- Simulation steps per second
- Render frames per second
- Worker message latency
- Memory use estimate
- Time to first visible wave
- Quality fallback events

## Release gates

A release candidate may not ship with:

- Known unstable solver parameter ranges
- Silent loss of saved experiments
- Unrecoverable rotation failures
- Physics validation failures outside approved tolerance
- A critical touch path available only by hover
