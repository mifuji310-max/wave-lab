# Android Performance and Rotation Validation

## Purpose

Record evidence for the Android performance and rotation architecture gate. The
in-app diagnostic reports viewport size, orientation, grid size, simulation
steps per second, and displayed frames per second.

Browser emulation is useful for layout checks, but it is not an Android
performance result. Complete this checklist on physical devices before closing
the architecture gate.

## Test scene

1. Open the deployed Wave Lab URL.
2. Confirm the version shown at the top is `0.1.0-prototype.3`.
3. Select **実験** and start **二波源干渉**.
4. Select **配置**, add one wall stroke, and place an observation point.
5. Select **表示**, open **端末・性能**, and wait at least five seconds.

## Rotation acceptance check

1. Record the portrait viewport, grid size, step/s, and fps.
2. Rotate to landscape while waves are running.
3. Confirm both sources, the wall, the observation point, and the evolving wave
   state remain present.
4. Confirm the diagnostic orientation and viewport values update.
5. Rotate back to portrait and repeat the state check.

The solver grid keeps its original shape during rotation so the physical field
is not stretched or silently resampled. This preserves circular wavefronts and
experiment state. A future grid-resizing design must define how displacement
and velocity fields are interpolated before implementation.

## Performance record

Record at least one recent, one mid-range, and one lower-performance Android
phone as required by `docs/QUALITY_AND_TESTING.md`.

| Device | Android / browser | Orientation | Viewport | Grid | step/s | fps | Result / notes |
| --- | --- | --- | --- | --- | ---: | ---: | --- |
| Pending | Pending | Portrait | Pending | Pending | Pending | Pending | Physical-device test required |
| Pending | Pending | Landscape | Pending | Pending | Pending | Pending | Physical-device test required |

## Current limitations

- User-agent detection is informational and may report `Android以外` in desktop
  device emulation.
- Browser-reported fps measures delivered simulation frames, not GPU timing.
- Worker round-trip latency and memory estimates remain separate performance
  instrumentation work.
