# Pass 11 — Audio / Haptic / PWA Platform-Truth Contract

## Mission

Make the Golden Match produce real player-facing sound on the intended installed-iPhone-PWA path, and report haptic capability honestly rather than treating semantic hook emission as proof of physical output.

This work is presentation/platform only. It must not own rules, legality, scoring, action selection, final battlefield geometry, or gameplay choreography sequencing.

## Audit finding that triggered this contract

The existing `src/presentation-feedback.js` emits semantic `gwent:audio-hook` events and tests verify those events, but the runtime contains no actual audio consumer: no `AudioContext`, no HTML audio playback, no decoded buffers, no audio assets, and no synthesized cue path. Therefore the previously reported silent installed-iPhone-PWA session is expected from the current implementation rather than proof of an iOS-only failure.

Existing haptics call `navigator.vibrate()` only when capability-detected and are disabled by default. Safari/iOS currently does not expose the Vibration API, so the installed iPhone PWA cannot deliver the intended custom tactile vocabulary through this web API. Native Core Haptics remains a future native-wrapper path, not something the PWA should pretend to provide.

## Locked ownership

### `src/presentation-feedback.js`

Keeps semantic ownership:

- which game/presentation moments request audio or haptic feedback;
- player settings (`effectsVolume`, `muted`, haptic opt-in);
- semantic hook identity and detail.

It does not synthesize/route actual audio device output beyond dispatching semantic requests.

### New platform-output layer

A dedicated presentation/platform module owns:

- Web Audio context creation;
- user-gesture unlock/resume;
- procedural minimum-production sound generation;
- gain application from semantic audio requests;
- AudioContext state/lifecycle recovery;
- playback status/error telemetry;
- platform capability reporting.

It must remain disposable and must never mutate engine state.

## Audio acceptance contract

### Real output path

The runtime must have a concrete, reachable player-facing sound path. For the Golden Match minimum bar this may use procedural Web Audio synthesis so the PWA remains offline-capable and does not depend on unfinished external assets.

A later dedicated audiovisual campaign may replace or augment these cues with authored assets, but Pass 11 may not ship with semantic events that never reach an audio device.

### Required semantic coverage

At minimum provide audible character for:

- card selection;
- valid target acquisition;
- ordinary close/ranged/siege placement;
- draw/discard;
- Spy;
- Horn;
- Bond;
- Muster;
- Medic;
- Decoy;
- Scorch;
- Frost/Fog/Rain/Clear Weather;
- Pass;
- player/opponent turn transition;
- round win/loss/draw;
- game win/loss/draw.

The procedural palette may be intentionally restrained. Signature effects such as Scorch should be materially distinguishable from ordinary card placement.

### User-gesture unlock

Because Safari/Web Audio may begin suspended, the platform layer must create/resume audio from real user activation. It should listen in capture phase to trusted pointer/touch/keyboard activation so the audio context is available before downstream game handlers emit a semantic cue from that same interaction.

A semantic cue arriving while the context is not yet running must produce explicit status (`queued`, `blocked`, or `failed`) rather than silently pretending it played.

### Lifecycle

Track and recover from at least:

- initial `suspended` context;
- normal `running` context;
- iOS/WebKit `interrupted` context where exposed;
- `visibilitychange` back to visible;
- `pageshow` / installed-PWA resume;
- closed/unrecoverable context.

Do not loop resume attempts aggressively. A later real user gesture remains the final recovery path if browser policy blocks programmatic resume.

### Settings truth

- default effects volume remains audible unless product evidence says otherwise;
- mute/zero volume suppresses real output as well as semantic audio dispatch;
- persisted volume/mute is honored on reload/relaunch;
- runtime gain uses the request's current effective volume;
- settings UI should expose enough status to diagnose whether audio is available/unlocked without becoming developer-only instrumentation.

### Diagnostics

Expose observation-only runtime state sufficient for automated QA and device debugging, including:

- installed;
- supported;
- context created/state;
- unlock attempts/successes/failures;
- audio requests;
- played cues;
- blocked/queued cues;
- failures;
- last cue/status/error;
- lifecycle resume attempts/results;
- last user activation source/time.

Emit an observation event for cue status so browser tests can prove the request reached the actual output layer rather than stopping at `gwent:audio-hook`.

## Haptic platform-truth contract

### Semantic requests remain useful

Keep the existing semantic haptic vocabulary and optional Android/other-browser Vibration API support. Automated QA should be able to observe:

- haptic semantic request;
- enabled/disabled state;
- platform capability;
- attempted pattern;
- success/failure result;
- unsupported reason.

### iPhone/PWA honesty

When `navigator.vibrate` is unavailable:

- do not claim tactile output;
- do not silently count the cue as a successful haptic;
- disable the player setting and describe it as unavailable in the current browser/platform;
- retain visual/audio equivalents;
- document that richer iPhone haptics require a native wrapper/app path using Apple-native haptic APIs.

No hidden switch/checkbox hack, synthetic click trick, or undocumented browser exploit may be used to fake arbitrary iPhone haptics.

## QA architecture

### Machine/static proof

Add a contract test that proves:

- the platform-output module is explicitly loaded and PWA-cached;
- semantic audio has a real consumer;
- user-activation and lifecycle recovery paths exist;
- diagnostics are observation-only;
- haptic unsupported/disabled/success outcomes remain distinguishable;
- no rules/action APIs are imported or called by the platform layer.

### Browser proof

Add a dedicated Playwright gate that proves:

1. audio context begins in an honest locked/uncreated state;
2. real user activation unlocks it;
3. an unmuted cue reaches the output layer and records `played`;
4. gain follows current settings;
5. mute and zero volume suppress playback;
6. persisted settings survive reload;
7. simulated lifecycle interruption/resume does not silently lose diagnostics;
8. unsupported haptics are reported as unsupported rather than successful;
9. a stub-capable browser path proves one supported vibration request is attempted exactly once;
10. ordinary match interaction still emits the expected semantic cue through the same path.

Where Playwright cannot prove physical speaker output, it must prove creation of connected audio nodes / successful scheduled playback plus running context state. Real audible output remains device proof.

### WebKit proof

The iPhone-targeted WebKit path must at least prove:

- the audio output module loads;
- user activation produces a running/recoverable AudioContext where Playwright WebKit permits it;
- `navigator.vibrate` capability is reported honestly;
- no unsupported haptic success is recorded.

### Real-device proof

Before final Pass 11 sensory signoff, an installed iPhone PWA must be manually checked for:

- audible ordinary placement;
- audible signature effect (Scorch preferred);
- volume adjustment;
- mute;
- background → resume;
- full relaunch;
- no false haptic claim.

If sound works but arbitrary haptics remain unavailable, Pass 11 may accept that platform ceiling only if the UI and continuity explicitly state it and the future native path remains preserved.

## Release discipline

- Do not weaken any existing 10.3–10.4C or Pass 11 gate.
- Do not treat emitted semantic hooks as playback success.
- Do not treat `navigator.vibrate` absence as a game bug on iPhone; treat false capability claims as a game bug.
- Do not merge until latest exact-head machine/browser evidence is green and generated evidence is reviewed.
- Real-device audio/haptic signoff remains separate from automated CI.

## Exact implementation order

1. Add the concrete Web Audio platform-output module and diagnostics.
2. Wire it explicitly into `index.html`, service-worker precache, deployment staging, and static contracts.
3. Improve haptic diagnostics/capability wording without changing semantic ownership.
4. Add deterministic/static and Playwright platform-feedback gates.
5. Run full exact-head CI.
6. Inspect generated diagnostics/evidence.
7. Perform real-iPhone PWA audio validation at the appropriate candidate/deployed checkpoint.
