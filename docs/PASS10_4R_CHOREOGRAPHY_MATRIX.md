# Pass 10.4R — Gameplay Choreography Matrix

Purpose: implementation-ready reference for 10.4A/B/C. Final deterministic state always comes from the engine. This matrix describes only presentation.

| Event | Player intent / source | Primary visual read | Secondary read | Suggested class | Input lock | Reduced-motion equivalent |
|---|---|---|---|---|---|---|
| Card press | finger/card | slight scale + depth acknowledgement | optional UI card sound | MICRO | none | opacity/outline acknowledgement |
| Card selected | hand | lift 8–14 px, 1.06–1.10 scale | legal destinations appear | MICRO/ROUTINE | none | outline + static elevation |
| Card deselect | hand/background | return to compositor slot | legal hints clear | MICRO | none | immediate state clear + short fade |
| Drag start | selected card | card detaches, source ghost remains | slight directional tilt | MICRO | pointer owns gesture | no tilt; direct follow |
| Drag over legal row | pointer/row | destination grows brighter/raised | row label + icon reinforce legality | MICRO | none | high-contrast border + icon |
| Drag over invalid space | pointer | destination feedback disappears | card remains attached | MICRO | none | same |
| Invalid drop | card/source | short return/spring to source | source slot restores | ROUTINE | until return completes or reconcile | short fade/translate back |
| Normal unit commit | hand→row | card travels and settles into row | row reflows around it | ROUTINE | brief commit phase | crossfade/short translate |
| Row score change | row | row score numerically transitions | total score follows | MICRO/ROUTINE | none after board stable | immediate number change + flash |
| Total score change | header | larger total transitions after row score | winning/losing relation visible | MICRO/ROUTINE | none | number change + emphasis |
| Spy | hand→opponent row | card visibly crosses centerline | exactly two draw arrivals to own hand | ABILITY | until draws establish hand | crossfade card to opponent + two hand flashes |
| Draw one | deck→hand | card emerges from deck abstraction and settles | hand compositor opens slot | ROUTINE | only if choice ambiguity | fade/scale into destination slot |
| Draw multiple | deck→hand | sequential arrivals with accelerated cadence | hand re-centers continuously | ABILITY | minimal | grouped fade-in with count cue |
| Horn special | hand→row socket | Horn enters socket; brass pulse travels row | eligible powers rise together | ABILITY | until row effect read | socket flash + power highlight |
| Horn leader | leader→row effect | leader origin pulse | same row ripple as special Horn | ABILITY | until row effect read | leader flash + static row highlight |
| Tight Bond | matching units | new card lands, matching set links/pulses | powers update simultaneously | ABILITY | minimal | shared border flash + number update |
| Morale Boost | morale unit→row | quiet row ripple | other eligible powers increment | ABILITY fast | minimal | row border flash + numbers |
| Muster small | initiator→deck/hand | rally pulse, 1–3 cards arrive individually | row re-centers per arrival | ABILITY/MAJOR | until final card established | grouped fade-in with light stagger |
| Muster large | initiator→deck/hand | first two distinct, accelerated middle, final distinct | swarm settles as pack | MAJOR | until pack established | grouped batch appearance |
| Scorch single target | effect→target | target pre-emphasis then char/dissolve | grave trajectory and score drop | MAJOR | until destruction identity is clear | target flash + dissolve |
| Scorch tied targets | effect→targets | simultaneous doom cue on all tied targets | near-simultaneous removal | MAJOR | until target set read | multi-target flash + fade |
| Villentretenmerth / row Scorch | played unit→opponent row | source card lands first; affected row then scorches | source remains if rules dictate | MAJOR | until effect resolves | source highlight then target fade |
| Frost | weather→close rows | cold front / edge frost reaches both Close rows | values reduce; row totals follow | ABILITY | until first value change | static cool tint fade |
| Fog | weather→ranged rows | mild local haze on both Ranged rows | values reduce | ABILITY | until first value change | static row treatment |
| Rain | weather→siege rows | restrained rain/wet sheen on Siege rows | values reduce | ABILITY | until first value change | static row treatment |
| Clear Weather | weather zone→rows | row environmental treatments retreat/fade | values restore | ABILITY | until restoration clear | short static treatment fade-out |
| Medic played | hand→row | Medic lands first | graveyard choice becomes available | ABILITY | choice state begins | normal placement + highlighted choice |
| Medic revive | grave→row | chosen card rises from grave context and travels to row | nested on-play effect follows if applicable | ABILITY | until revived card established | fade from grave to row |
| Decoy | hand↔board unit | two-object exchange choreography | hand and row reflow together | ABILITY | until exchange complete | two-location crossfade |
| Agile choose row | selected card | both legal rows available | hovered/tapped row becomes dominant | MICRO | none until commit | outline/icon choices |
| Mardroeme | special/ability→row | row alchemy pulse | Berserkers transform in place | MAJOR | until transformed identities establish | flash + immediate art/value swap |
| Berserker transform | unit | old unit collapses/glows into transformed card | score follows after identity change | ABILITY | minimal | crossfade card face |
| Hero played | hand→row | heavier material landing | brief immunity/glint cue | ABILITY fast | minimal | short crest/outline flash |
| Avenger summon | grave/removal→summon | removal resolves first; summoned replacement emerges | row reflows | ABILITY | until replacement visible | fade replacement in |
| Leader active ability | leader dock | leader card lifts/illuminates as origin | target/effect animation follows | ABILITY | until target state clear | leader flash + target highlight |
| Leader becomes spent | leader dock | card settles/dims to spent state | label/icon changes | MICRO | none | direct state change |
| Pass | pass control/player status | heavier press, permanent PASSED chip locks | hand de-emphasizes | ABILITY fast | no further player card input | static status change + flash |
| Opponent pass | opponent status | PASSED appears attached to opponent | turn pill updates | ABILITY fast | none | static status change |
| Turn change | header | center turn pill transitions | subtle side emphasis swaps | MICRO/ROUTINE | none | text/contrast swap |
| Round resolved | whole board | scores hold, life token changes, rows clear in groups | retained/resurrected cards resolve after clear | MAJOR | until next round state usable | score hold + grouped fade to next state |
| Monster retain | board | retained card remains while peers clear | brief retention emphasis | ABILITY | during round transition | retained border flash |
| Skellige resurrection | grave→board | two cards re-enter after round transition | origin from grave context | MAJOR | during round transition | grouped fade-in |
| Northern Realms bonus draw | deck→hand | one post-round card draw | hand re-centers | ROUTINE | during round transition | hand slot fade-in |
| Match win/loss | result overlay | conclusive result reveal | final round scores/history | MAJOR | match over | fade/static reveal |
| Undo (developer/assist) | history state | concise rewind/reconcile, not literal reverse-particle playback | classification/state restored | ROUTINE | until reconcile | immediate state swap + flash |
| Save/resume | persisted state | no attempt to resume interrupted animation | stable final engine state renders | none | n/a | same |

## Chaining rules

### Principle 1 — source event before consequence

A card should appear to land before its ability appears to affect the board, unless the mechanic's identity specifically requires the card to disappear as part of resolution. This preserves causal comprehension.

Examples:
- Spy crosses and lands before draw animations.
- Horn reaches its socket before row powers rise.
- Muster initiator lands before summoned cards arrive.
- Medic lands before graveyard choice opens.
- Villentretenmerth lands before row Scorch fires.

### Principle 2 — destructive identity before layout collapse

Rows must not re-center until the player has had a perceptual beat to identify which cards are being removed.

Scorch order:
1. identify doomed targets;
2. destructive effect;
3. remove;
4. reflow survivors;
5. scores update.

### Principle 3 — score follows visual cause

Do not animate a score before the player sees what changed it. In very large multi-card effects, scores may tick in grouped beats rather than waiting until the absolute end, but the numeric changes should remain synchronized with visible arrivals/removals.

### Principle 4 — chain depth must be bounded

Nested effects can generate long transactions. The planner must collapse or accelerate low-value middle beats while preserving the first cause, each tactically important choice, and the final consequence.

Example: Medic revives a Muster unit that summons six cards. The player must see Medic → revived Muster unit → pack arrival, but individual score counters do not need a long independent animation after every summoned card.

### Principle 5 — opponent actions use the same language

Opponent cards should not teleport simply because the AI chose them. AI and human actions share the same presentation transactions. The only difference is input gesture: opponent cards originate from the opponent hand abstraction and travel to their destinations automatically.

## Spatial origins

Presentation should preserve these conceptual sources even if actual deck/grave stacks are compact UI elements:

- player hand
- opponent hand abstraction
- player deck
- opponent deck
- player graveyard
- opponent graveyard
- player leader
- opponent leader
- weather zone
- row special sockets
- six unit rails

When a source is offscreen/abstracted, motion may begin at the nearest visible representative anchor rather than an invented arbitrary point.

## Interaction lock policy

Avoid globally freezing the entire screen for routine animation. Lock only interactions that could conflict with unresolved placement/choice.

- Selection: no lock.
- Drag: pointer gesture owns selected card only.
- Ordinary commit: briefly lock card-play input until destination established; menu/assist controls may remain available if safe.
- Ability chain: lock new card plays until choice/effect establishes a stable board.
- Score counting after stable board: no lock.
- Major round transition: lock gameplay until next round becomes valid.

## Quality target

The motion system succeeds when a player can understand a complicated turn with the text event log hidden. The sequence itself should make the rules legible.

The intended emotional result is tactile, grounded, and confident: physical cards on a premium Witcher tabletop, not flashy collectible-card-game spectacle.