# 🏛️ TEMPLE DEFENDER: ROMA INVICTA 🦅
### *A 3rd-Person Roman Wall Defense Action Game*

Defend the sacred **Temple of Mars Capitolinus** against the relentless Hellenic armies of Greece! As **Centurion Valerius** of the Roman Legio IX Hispana, you command the ramparts, wield the steel Gladius, raise the impenetrable Scutum shield, and repel the Greek hoplites, skirmishers, battering rams, and Spartan champions.

> [!NOTE]
> **Homeschool Project**: This is a homeschool educational project created to study and explore ancient Roman history, classical architecture, and Roman legionary defense tactics against Hellenic Greek forces.

---

## 🎮 How to Launch & Play

### Option 1: Quick Launch Script (Recommended)
Open your terminal in this directory and run:
```bash
./start.sh
```
This starts a local lightweight web server and automatically opens your default browser at `http://localhost:8080`.

### Option 2: Python HTTP Server
```bash
python3 -m http.server 8080
```
Then navigate to [http://localhost:8080](http://localhost:8080) in Chrome, Safari, Edge, or Firefox.

---

## ⚔️ Controls

| Action | Key / Input |
|---|---|
| **Move** | `W`, `A`, `S`, `D` |
| **Look / Aim** | `Mouse` (Click canvas to lock camera, `Esc` to unlock) |
| **Gladius Melee Attack** | `Left Mouse Button` (3-hit combo: Slash ➔ Shield Bash ➔ Lethal Thrust) |
| **Scutum Shield Block** | `Right Mouse Button` (Hold to absorb frontal strikes & arrows) |
| **Aim & Throw Pilum** | `Q` (Hold to aim ballistic trajectory, release or click to throw) |
| **Sprint** | `Shift` (Consumes stamina) |
| **Dodge Roll** | `Space` (Evasive roll with invulnerability frames) |
| **Interact / Wall Defenses**| `E` (Push down Greek assault ladders or drop heavy boulders) |
| **Roman Arrow Volley** | `1` (Order Sagittarii archers to rain flaming arrows on targeted area) |
| **Testudo Shield Wall** | `2` (Lock shields at the gate, reducing breach damage by 80%) |
| **"ROMA INVICTA!" War Cry**| `3` (Rallying roar boosting speed, stamina, and melee damage by +50%) |

---

## 🛡️ Key Features

1. **Third-Person Combat & Movement:**
   - Over-the-shoulder responsive camera with dynamic pitch, yaw, and collision avoidance.
   - Smooth Roman Centurion animations: walk/sprint cycles, cape fluttering, gladius attack swings, shield bashes, and defensive stances.
   - Stamina and Health management with tactical dodge rolling.

2. **Fortress & Rampart Defenses:**
   - Full 3D Roman Temple architecture: marble columns, friezes, golden eagle pediment, altar braziers with dynamic flickering fire.
   - Battlements, merlons, and stone staircases connecting the ramparts to the courtyard and gate.
   - Destructible Central Gate with real-time health indicator.
   - Interactive boulder racks along the parapet to crush clusters of advancing hoplites.
   - Greek siege ladders that can be kicked down before enemies mount the wall!

3. **Greek Hellenic Invaders:**
   - **Greek Hoplites:** Bronze muscle cuirasses, Corinthian helmets, and Spartan Lambda ($\Lambda$) shields. Advance in formation to assault the gate or climb ladders.
   - **Greek Peltasts:** Fast skirmishers throwing javelins at defenders on the wall.
   - **Greek Toxotai:** Archers firing high-arc flaming arrows at the battlements.
   - **Battering Ram:** Heavy covered wooden chassis targeting the gate.
   - **Spartan Champion (Boss):** Giant warrior with devastating leap strikes and heavy cleaves.

4. **Allied Roman Legionaries:**
   - Sagittarii archers perched on tower bastions providing covering fire.
   - Gate infantry holding the breach.
   - Responsive tactical command orders (`1`, `2`, `3`).

5. **Armory of Mars (Upgrades):**
   - Earn **Valor (Denarii)** by defeating invaders.
   - Between waves, unlock:
     - *Damascus Gladius* (+Damage & Attack Speed)
     - *Praetorian Scutum* (100% Block & extended stun)
     - *Flaming Pila* (Explosive Greek Fire on impact)
     - *Gate & Wall Masonry* (Repairs and fortifies the gate)
     - *Roman Sagittarii* (Extra archers on the ramparts)
     - *Endurance Training* (+Health & Stamina regen)

6. **Procedural Web Audio Engine:**
   - Zero external audio files required — synthesized using the Web Audio API.
   - Roman bucina war horns, metallic sword clashes, shield blocks, war drums, boulder smashes, and triumphant fanfares.
