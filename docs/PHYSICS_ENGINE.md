# Physics Engine

## 1. Model

The first implementation uses a two-dimensional scalar damped wave equation:

\[
\frac{\partial^2 u}{\partial t^2}
=
c^2 \nabla^2u
-\gamma\frac{\partial u}{\partial t}
+S(x,y,t)
\]

Where:

- \(u(x,y,t)\) is scalar displacement
- \(c\) is propagation speed
- \(\gamma\) is damping
- \(S\) is the source term

This is an educational model of a wave field. It is not a complete fluid simulation and must not be described as one.

## 2. Numerical method

Initial candidate:

- Explicit finite-difference time-domain method
- Uniform Cartesian grid
- Second-order centered spatial differences
- Second-order time update
- Float32 arrays

The exact update equation must be recorded next to the implementation and covered by unit tests.

### Prototype update equation

The initial Worker prototype uses the following explicit update, where
`r = c Δt / Δx` and `L(u)` is the five-point discrete Laplacian:

\[
u^{n+1} = (2 - \gamma\Delta t)u^n - (1 - \gamma\Delta t)u^{n-1}
+ r^2 L(u^n) + \Delta t^2 S^n
\]

The implementation calculates `r` and rejects configurations outside the
two-dimensional stability limit before allocating solver arrays. The prototype
uses a fixed zero-value outer edge only to test the update and Worker protocol.
It is not the required absorbing outer boundary for v0.1 and must not be used
for lesson validation until that boundary is implemented and documented.

## 3. Stability

The time step must satisfy the stability requirement for the selected scheme. For the conventional two-dimensional second-order stencil:

\[
\frac{c\Delta t}{\Delta x}\leq\frac{1}{\sqrt{2}}
\]

The implementation must calculate and enforce a safety margin. UI parameters may not create an unstable solver state.

## 4. Sources

### Pulse source

A finite-duration source with a documented temporal envelope.

### Continuous source

A sinusoidal source with:

- Frequency
- Amplitude
- Phase
- Start time

### Point source

Numerically distributed over a small kernel rather than an unbounded mathematical point.

### Line source

A set of coherent source cells forming an approximately planar wave.

## 5. Boundaries

Required for v0.1:

- Rigid/reflecting obstacles
- Outer absorbing region to reduce artificial edge reflections
- Open cells forming a slit

The exact physical interpretation of a “wall” must be documented. Fixed-value and zero-normal-gradient boundaries represent different idealizations and must not be mixed without explanation.

## 6. Observation

The observer samples \(u\) at a physical coordinate using a documented interpolation method.

Derived phase is valid only for sufficiently periodic signals. During pulses or multi-frequency interference, the UI must label phase as unavailable or approximate.

## 7. Units

The internal solver may use normalized units. The UI may show educational units only when a consistent mapping is defined.

Never present arbitrary grid cells as centimeters without an explicit scale.

## 8. Validation suite

Minimum validation cases:

1. Circular symmetry from a centered point pulse
2. Propagation speed against expected grid distance/time
3. Reflection from a straight boundary
4. Superposition linearity
5. Two coherent sources: nodal and antinodal structure
6. Diffraction trend as slit width/wavelength ratio changes
7. Energy trend in an undamped closed field
8. Damping trend when \(\gamma>0\)
9. No numerical blow-up within supported parameter bounds

Each case records:

- Configuration
- Expected behavior
- Metric
- Tolerance
- Result
- Device and build

## 9. Educational honesty

The application must disclose simplifications:

- Scalar field
- Two spatial dimensions
- Idealized boundaries
- Numerical dispersion
- Artificial damping or absorption

Visual clarity may be enhanced, but the renderer must not invent wave behavior absent from the solver.
