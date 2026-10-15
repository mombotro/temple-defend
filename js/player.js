import * as THREE from 'three';
import { createRomanCenturion } from './models.js';
import { soundEngine } from './audio.js';

export class Player {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // Character 3D Model
    this.modelData = createRomanCenturion();
    this.mesh = this.modelData.root;
    this.scene.add(this.mesh);

    // Initial position on the Temple Wall parapet overlooking the battlefield!
    this.position = new THREE.Vector3(0, 7.2, 0);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = Math.PI; // Face outwards toward battlefield (+Z)

    // Camera & Mouse Look
    this.yaw = 0; // Horizontal rotation
    this.pitch = -0.15; // Vertical tilt
    this.cameraDistance = 4.8;
    this.cameraOffset = new THREE.Vector3(0.65, 1.8, 0); // Over right shoulder
    this.isPointerLocked = false;

    // Movement & Physics
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 6.8;
    this.sprintSpeed = 11.2;
    this.isSprinting = false;
    this.isRolling = false;
    this.rollTimer = 0;
    this.rollDuration = 0.55;
    this.rollDirection = new THREE.Vector3();

    // Wall & Ground Collision States
    this.onWall = true; // Starts on the temple rampart
    this.onStair = null; // null, 'left', or 'right'
    this.radius = 0.55;

    // Solid obstacles on ground level (AABB boxes that block movement)
    this.groundObstacles = [
      // Left stone wall (leaves [-2.2, 2.2] clear for central gate passageway)
      { minX: -42.5, maxX: -2.2, minZ: -2.4, maxZ: 2.4 },
      // Right stone wall
      { minX: 2.2, maxX: 42.5, minZ: -2.4, maxZ: 2.4 },
      // Gate left bastion tower
      { minX: -12.2, maxX: -3.8, minZ: -4.2, maxZ: 4.2 },
      // Gate right bastion tower
      { minX: 3.8, maxX: 12.2, minZ: -4.2, maxZ: 4.2 },
      // End left bastion tower
      { minX: -46.2, maxX: -37.8, minZ: -4.2, maxZ: 4.2 },
      // End right bastion tower
      { minX: 37.8, maxX: 46.2, minZ: -4.2, maxZ: 4.2 },
      // Temple Sanctuary Cella (solid marble building behind wall)
      { minX: -9.5, maxX: 9.5, minZ: -44.0, maxZ: -22.0 }
    ];

    // Input States
    this.keys = {
      w: false, a: false, s: false, d: false,
      shift: false, space: false, q: false, e: false, f: false,
      mouse0: false, mouse2: false
    };

    // Stats & Resources
    this.maxHealth = 100;
    this.health = 100;
    this.maxStamina = 100;
    this.stamina = 100;
    this.staminaRegenRate = 22;
    this.denarii = 0;
    this.kills = 0;

    // Pila (Javelins)
    this.maxPila = 3;
    this.pilaCount = 3;
    this.pilaRegenTimer = 0;
    this.isAimingPilum = false;

    // Combat State
    this.isAttacking = false;
    this.comboIndex = 0; // 0, 1, 2
    this.attackTimer = 0;
    this.attackDuration = 0.38;
    this.comboWindow = 0;
    this.isBlocking = false;
    this.isInvulnerable = false;
    this.hitEnemiesThisSwing = new Set();

    // Upgrades
    this.upgrades = {
      gladiusDamageMult: 1.0,
      attackSpeedMult: 1.0,
      shieldDefense: 0.9, // 90% block standard
      shieldStunDuration: 1.2,
      flamingPila: false,
      extraArchers: 0
    };

    // Tactical Abilities Cooldowns
    this.cooldowns = {
      arrows: 0, // 20s
      testudo: 0, // 25s
      warcry: 0  // 30s
    };
    this.warcryActive = false;
    this.warcryTimer = 0;

    // Walk Animation cycle timer
    this.walkAnimTime = 0;

    // Setup input listeners
    this.setupInputs();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
      if (e.key === 'Shift') this.keys.shift = true;
      if (e.code === 'Space') {
        this.keys.space = true;
        this.triggerDodgeRoll();
      }

      // Tactical Orders & Combat Keys
      if (e.key === '1') this.useArrowVolley();
      if (e.key === '2') this.useTestudo();
      if (e.key === '3') this.useWarCry();
      if (e.key === 'q') this.toggleAimPilum(true);
      if (key === 'f') this.isBlocking = true;
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (this.keys.hasOwnProperty(key)) this.keys[key] = false;
      if (e.key === 'Shift') this.keys.shift = false;
      if (e.code === 'Space') this.keys.space = false;
      if (key === 'f') this.isBlocking = this.keys.mouse2;
      if (e.key === 'q') {
        if (this.isAimingPilum) {
          this.throwPilum();
        }
        this.toggleAimPilum(false);
      }
    });

    // Mouse Listeners
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.keys.mouse0 = true;
        if (this.isAimingPilum) {
          this.throwPilum();
          this.toggleAimPilum(false);
        } else {
          this.triggerAttack();
        }
      }
      if (e.button === 2) {
        this.keys.mouse2 = true;
        this.isBlocking = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.keys.mouse0 = false;
      if (e.button === 2) {
        this.keys.mouse2 = false;
        this.isBlocking = false;
      }
    });

    // Prevent default context menu on right-click block
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse Movement / Aiming
    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      const sens = 0.0022;
      this.yaw -= e.movementX * sens;
      this.pitch -= e.movementY * sens;

      // Clamp pitch so camera doesn't flip or clip underground
      this.pitch = Math.max(-1.1, Math.min(0.85, this.pitch));
    });

    // Pointer Lock Management
    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked && document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement);
      const prompt = document.getElementById('pointer-lock-prompt');
      if (prompt) {
        prompt.classList.toggle('visible', !this.isPointerLocked);
      }
    });
  }

  // --- ACTIONS & COMBAT TRIGGERS ---

  triggerAttack() {
    if (this.isAttacking || this.isRolling) return;
    if (this.stamina < 12) return;

    this.isAttacking = true;
    this.isBlocking = false;
    this.stamina -= 12;
    this.attackTimer = 0;
    this.attackDuration = (0.35 / this.upgrades.attackSpeedMult);

    // Snap Centurion body to face directly where crosshair is aiming!
    this.mesh.rotation.y = this.yaw + Math.PI;

    // Reset enemies hit for this fresh sword swing
    this.hitEnemiesThisSwing = new Set();

    soundEngine.playSwordSwing();

    // Advance combo
    this.comboIndex = (this.comboIndex + 1) % 3;
    this.comboWindow = 0.8;
  }

  triggerDodgeRoll() {
    if (this.isRolling || this.isAttacking) return;
    if (this.stamina < 24) return;

    this.isRolling = true;
    this.isInvulnerable = true;
    this.rollTimer = 0;
    this.stamina -= 24;

    // Roll in movement direction, or forward if stationary
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const dir = new THREE.Vector3();

    if (this.keys.w) dir.add(forward);
    if (this.keys.s) dir.sub(forward);
    if (this.keys.d) dir.add(right);
    if (this.keys.a) dir.sub(right);

    if (dir.lengthSq() < 0.01) dir.copy(forward);
    dir.normalize();
    this.rollDirection.copy(dir);

    soundEngine.playSwordSwing();
  }

  toggleAimPilum(active) {
    if (this.pilaCount <= 0 && active) return;
    this.isAimingPilum = active;
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.classList.toggle('aiming', active);
  }

  throwPilum() {
    if (this.pilaCount <= 0) return;
    this.pilaCount--;
    soundEngine.playPilumThrow();

    // Spawn Pilum projectile
    if (this.onThrowPilumCallback) {
      // Calculate origin (Centurion's hand) & launch vector towards crosshair center
      const spawnPos = this.position.clone().add(new THREE.Vector3(0, 1.8, 0));
      const aimDir = new THREE.Vector3(
        -Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        -Math.cos(this.yaw) * Math.cos(this.pitch)
      ).normalize();

      this.onThrowPilumCallback(spawnPos, aimDir, this.upgrades.flamingPila);
    }
  }

  useArrowVolley() {
    if (this.cooldowns.arrows > 0) return;
    this.cooldowns.arrows = 18;
    soundEngine.playWarHorn(1.2);
    soundEngine.playArrowVolley();

    if (this.onArrowVolleyCallback) {
      this.onArrowVolleyCallback(this.position.clone().add(new THREE.Vector3(-Math.sin(this.yaw) * 15, 0, -Math.cos(this.yaw) * 15)));
    }
  }

  useTestudo() {
    if (this.cooldowns.testudo > 0) return;
    this.cooldowns.testudo = 24;
    soundEngine.playWarHorn(0.9);
    soundEngine.playShieldBlock();

    if (this.onTestudoCallback) {
      this.onTestudoCallback();
    }
  }

  useWarCry() {
    if (this.cooldowns.warcry > 0) return;
    this.cooldowns.warcry = 28;
    this.warcryActive = true;
    this.warcryTimer = 10;
    soundEngine.playWarHorn(1.4);

    // Instant stamina restore & health boost
    this.stamina = this.maxStamina;
    this.health = Math.min(this.maxHealth, this.health + 30);
  }

  takeDamage(amount, threatSource = null) {
    if (this.isInvulnerable || this.health <= 0) return 0;

    let finalDamage = amount;

    // Check if blocking and attack is from the front
    if (this.isBlocking && threatSource && this.stamina > 5) {
      // Find horizontal direction from player to the threat
      const toThreat = threatSource.clone().sub(this.position);
      toThreat.y = 0;

      // Handle if threatSource was already a direction vector or a world position
      const distSq = toThreat.lengthSq();
      const threatDir = distSq > 0.01 ? toThreat.normalize() : threatSource.clone().setY(0).normalize();

      // Where is the Scutum shield facing? Camera world direction!
      const facing = new THREE.Vector3();
      this.camera.getWorldDirection(facing);
      facing.y = 0;
      facing.normalize();

      const dot = facing.dot(threatDir);

      if (dot > 0.15) { // Frontal 160-degree shield block arc!
        finalDamage = amount * (1.0 - this.upgrades.shieldDefense);
        this.stamina = Math.max(0, this.stamina - Math.max(8, amount * 0.35));

        soundEngine.playShieldBlock();

        if (this.onBlockCallback) {
          this.onBlockCallback(this.position);
        }

        // 90% to 100% mitigated
        if (finalDamage <= 1.0) {
          return 0; // Completely absorbed!
        }
      }
    }

    this.health = Math.max(0, this.health - finalDamage);
    soundEngine.playSwordHit();

    // Damage screen vignette flash
    const vig = document.getElementById('damage-vignette');
    if (vig) {
      vig.classList.add('hurt');
      setTimeout(() => vig.classList.remove('hurt'), 200);
    }

    return finalDamage;
  }

  // --- WALL & ENVIRONMENT SLIDING COLLISION SYSTEM ---
  applyMovementWithCollision(moveVec) {
    const r = this.radius;
    let newX = this.position.x + moveVec.x;
    let newZ = this.position.z + moveVec.z;
    let newY = this.position.y;

    // ----------------------------------------------------
    // STATE 1: Player is on the Wall Walkway or Stairs
    // ----------------------------------------------------
    if (this.onWall) {
      // Check if near stair entrances: Left stair (x ≈ -14) or Right stair (x ≈ 14)
      const nearLeftStair = (this.position.x >= -16.0 && this.position.x <= -12.0);
      const nearRightStair = (this.position.x >= 12.0 && this.position.x <= 16.0);

      // Left Stair logic
      if (this.onStair === 'left' || (nearLeftStair && newZ < -1.6)) {
        this.onStair = 'left';
        newX = Math.max(-15.4, Math.min(-12.6, newX)); // Constrain to stair width

        if (newZ <= -14.6) {
          // Reached bottom of stairs: transition to courtyard ground!
          this.onWall = false;
          this.onStair = null;
          newY = 0.0;
        } else if (newZ >= -1.6) {
          // Reached top of wall!
          this.onWall = true;
          this.onStair = null;
          newY = 7.2;
        } else {
          // On stair slope
          const t = (newZ - (-14.6)) / (-1.6 - (-14.6));
          newY = THREE.MathUtils.clamp(t * 7.2, 0.0, 7.2);
        }
      } 
      // Right Stair logic
      else if (this.onStair === 'right' || (nearRightStair && newZ < -1.6)) {
        this.onStair = 'right';
        newX = Math.max(12.6, Math.min(15.4, newX)); // Constrain to stair width

        if (newZ <= -14.6) {
          // Reached bottom of stairs: transition to courtyard ground!
          this.onWall = false;
          this.onStair = null;
          newY = 0.0;
        } else if (newZ >= -1.6) {
          // Reached top of wall!
          this.onWall = true;
          this.onStair = null;
          newY = 7.2;
        } else {
          // On stair slope
          const t = (newZ - (-14.6)) / (-1.6 - (-14.6));
          newY = THREE.MathUtils.clamp(t * 7.2, 0.0, 7.2);
        }
      } 
      // Main Wall Walkway (Not on stairs)
      else {
        this.onStair = null;
        newY = 7.2;

        // Front parapet merlons: stops player at z = 1.6 (solid wall prevents falling/clipping!)
        newZ = Math.min(1.6, newZ);

        // Rear stone railing: stops player at z = -1.6 (solid railing except at stairs)
        newZ = Math.max(-1.6, newZ);

        // Left & Right end towers block ends of walkway
        newX = Math.max(-38.2, Math.min(38.2, newX));
      }
    } 
    // ----------------------------------------------------
    // STATE 2: Player is on Ground Level (Courtyard / Battlefield)
    // ----------------------------------------------------
    else {
      // Check if stepping onto the bottom of stairs from the courtyard
      const steppingLeftStair = (newZ >= -14.8 && newZ <= -1.6 && Math.abs(newX - (-14)) < 1.7 && moveVec.z > 0);
      const steppingRightStair = (newZ >= -14.8 && newZ <= -1.6 && Math.abs(newX - 14) < 1.7 && moveVec.z > 0);

      if (steppingLeftStair) {
        this.onWall = true;
        this.onStair = 'left';
        newX = Math.max(-15.4, Math.min(-12.6, newX));
        const t = (newZ - (-14.6)) / (-1.6 - (-14.6));
        newY = THREE.MathUtils.clamp(t * 7.2, 0.0, 7.2);
      } else if (steppingRightStair) {
        this.onWall = true;
        this.onStair = 'right';
        newX = Math.max(12.6, Math.min(15.4, newX));
        const t = (newZ - (-14.6)) / (-1.6 - (-14.6));
        newY = THREE.MathUtils.clamp(t * 7.2, 0.0, 7.2);
      } else {
        // Sliding collision against solid ground obstacles (walls, towers, temple building)
        // 1. Move & test X
        let testX = newX;
        for (const obs of this.groundObstacles) {
          if (testX > obs.minX - r && testX < obs.maxX + r && this.position.z > obs.minZ - r && this.position.z < obs.maxZ + r) {
            const dL = testX - (obs.minX - r);
            const dR = (obs.maxX + r) - testX;
            testX = (dL < dR) ? (obs.minX - r) : (obs.maxX + r);
          }
        }
        newX = testX;

        // 2. Move & test Z
        let testZ = newZ;
        for (const obs of this.groundObstacles) {
          if (newX > obs.minX - r && newX < obs.maxX + r && testZ > obs.minZ - r && testZ < obs.maxZ + r) {
            const dB = testZ - (obs.minZ - r);
            const dF = (obs.maxZ + r) - testZ;
            testZ = (dB < dF) ? (obs.minZ - r) : (obs.maxZ + r);
          }
        }
        newZ = testZ;

        // Ground / Podium height
        if (newZ <= -15 && Math.abs(newX) <= 13) {
          newY = 2.5; // On temple terrace
        } else if (newZ > -15 && newZ <= -10 && Math.abs(newX) <= 8) {
          const stepT = (-10 - newZ) / 5.0;
          newY = stepT * 2.5; // Temple front steps
        } else {
          newY = 0.0; // Courtyard or battlefield ground
        }
      }
    }

    // World bounds clamp
    newX = Math.max(-52, Math.min(52, newX));
    newZ = Math.max(-52, Math.min(50, newZ));

    this.position.x = newX;
    this.position.z = newZ;
    this.position.y += (newY - this.position.y) * 0.4;
    this.mesh.position.copy(this.position);
  }

  // --- HEIGHT & ENVIRONMENT COLLISION MAP FOR CAMERA ---
  calculateTerrainHeight(x, z) {
    if (Math.abs(x) <= 42 && z >= -2.4 && z <= 2.4) {
      return 7.2;
    }
    if ((Math.abs(x - (-14)) < 2.0 || Math.abs(x - 14) < 2.0) && z >= -14.6 && z <= -2.4) {
      const progress = (z - (-14.6)) / (-2.4 - (-14.6));
      return THREE.MathUtils.clamp(progress * 7.2, 0, 7.2);
    }
    if (Math.abs(x) <= 13 && z <= -15 && z >= -48) {
      return 2.5;
    }
    return 0.0;
  }

  // --- MAIN UPDATE LOOP ---
  update(delta) {
    // 1. Cooldowns & Timers
    ['arrows', 'testudo', 'warcry'].forEach(cmd => {
      if (this.cooldowns[cmd] > 0) {
        this.cooldowns[cmd] = Math.max(0, this.cooldowns[cmd] - delta);
      }
    });

    if (this.warcryActive) {
      this.warcryTimer -= delta;
      if (this.warcryTimer <= 0) this.warcryActive = false;
    }

    if (this.comboWindow > 0) {
      this.comboWindow -= delta;
      if (this.comboWindow <= 0) this.comboIndex = 0;
    }

    // Pilum regeneration
    if (this.pilaCount < this.maxPila) {
      this.pilaRegenTimer += delta;
      if (this.pilaRegenTimer >= 14) { // Regenerates every 14s
        this.pilaCount++;
        this.pilaRegenTimer = 0;
      }
    }

    // Stamina Regeneration
    if (!this.isSprinting && !this.isRolling && !this.isBlocking) {
      const regenMult = this.warcryActive ? 3.0 : 1.0;
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate * regenMult * delta);
    }

    // Health slow regen out of combat
    if (this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + 1.5 * delta);
    }

    // 2. Dodge Roll Logic
    if (this.isRolling) {
      this.rollTimer += delta;
      const progress = this.rollTimer / this.rollDuration;
      const rollSpeed = 14.5 * (1 - progress * 0.4);
      this.applyMovementWithCollision(this.rollDirection.clone().multiplyScalar(rollSpeed * delta));

      // Roll animation rotation
      this.mesh.rotation.y = Math.atan2(this.rollDirection.x, this.rollDirection.z);
      this.modelData.torsoGroup.rotation.x = progress * Math.PI * 2;

      if (progress >= 1.0) {
        this.isRolling = false;
        this.isInvulnerable = false;
        this.modelData.torsoGroup.rotation.x = 0;
      }
    } else {
      // 3. Normal Movement (Camera Relative)
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      const moveDir = new THREE.Vector3();

      if (this.keys.w) moveDir.add(forward);
      if (this.keys.s) moveDir.sub(forward);
      if (this.keys.d) moveDir.add(right);
      if (this.keys.a) moveDir.sub(right);

      const isMoving = moveDir.lengthSq() > 0.01;
      if (isMoving) {
        moveDir.normalize();

        // Sprinting
        this.isSprinting = this.keys.shift && this.stamina > 10 && !this.isBlocking;
        if (this.isSprinting) {
          this.stamina = Math.max(0, this.stamina - 15 * delta);
          if (this.stamina <= 0) this.isSprinting = false;
        }

        const currentSpeed = (this.isSprinting ? this.sprintSpeed : this.moveSpeed) * (this.warcryActive ? 1.3 : 1.0) * (this.isBlocking ? 0.45 : 1.0);
        this.applyMovementWithCollision(moveDir.clone().multiplyScalar(currentSpeed * delta));

        // Smoothly face movement direction or camera direction if aiming/blocking
        if (this.isBlocking || this.isAimingPilum || this.isAttacking) {
          this.mesh.rotation.y = this.yaw + Math.PI;
        } else {
          const targetRot = Math.atan2(moveDir.x, moveDir.z);
          let diff = targetRot - this.mesh.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          this.mesh.rotation.y += diff * Math.min(1.0, 14 * delta);
        }

        // Walk Animation
        this.walkAnimTime += delta * (this.isSprinting ? 14 : 9);
        const legSwing = Math.sin(this.walkAnimTime) * 0.65;
        this.modelData.legLGroup.rotation.x = legSwing;
        this.modelData.legRGroup.rotation.x = -legSwing;

        // Cape swings backwards, anchored at shoulder blades - never intersects head/helmet!
        const capeSpeed = this.isSprinting ? 0.38 : 0.18;
        const capeWave = Math.sin(this.walkAnimTime * 2) * 0.06;
        this.modelData.cape.rotation.x = Math.max(0.08, Math.min(0.65, 0.10 + capeSpeed + capeWave));
      } else {
        // Idle: update collision in place
        this.applyMovementWithCollision(new THREE.Vector3(0, 0, 0));

        // Always face crosshair when attacking, aiming pilum, or blocking even if standing still!
        if (this.isBlocking || this.isAimingPilum || this.isAttacking) {
          this.mesh.rotation.y = this.yaw + Math.PI;
        }

        this.modelData.legLGroup.rotation.x *= 0.8;
        this.modelData.legRGroup.rotation.x *= 0.8;
        const idleWave = Math.sin(Date.now() * 0.0025) * 0.03;
        this.modelData.cape.rotation.x = 0.10 + idleWave;
      }
    }

    // 5. Attack & Block Postures
    if (this.isAttacking) {
      this.attackTimer += delta;
      const prog = Math.min(1.0, this.attackTimer / this.attackDuration);

      if (this.comboIndex === 1) {
        // Attack 1: Right Gladius Slash (Horizontal sweep)
        this.modelData.rightArmGroup.rotation.x = Math.sin(prog * Math.PI) * 1.6;
        this.modelData.rightArmGroup.rotation.y = -Math.sin(prog * Math.PI) * 1.4;
      } else if (this.comboIndex === 2) {
        // Attack 2: Scutum Shield Bash (Thrust left shield forward)
        this.modelData.leftArmGroup.position.z = Math.sin(prog * Math.PI) * 0.6;
        this.modelData.leftArmGroup.rotation.y = Math.sin(prog * Math.PI) * 0.5;
      } else {
        // Attack 3: Lethal Gladius Thrust (Straight forward lunging stab)
        this.modelData.rightArmGroup.position.z = Math.sin(prog * Math.PI) * 0.8;
        this.modelData.rightArmGroup.rotation.x = Math.PI / 4 + Math.sin(prog * Math.PI) * 0.8;
      }

      if (prog >= 1.0) {
        this.isAttacking = false;
        this.modelData.rightArmGroup.rotation.set(0, 0, 0);
        this.modelData.leftArmGroup.rotation.set(0, 0, 0);
        this.modelData.rightArmGroup.position.set(-0.35, 1.35, 0);
        this.modelData.leftArmGroup.position.set(0.35, 1.35, 0);
      }
    } else if (this.isBlocking) {
      // Scutum raised directly in front of chest facing forward!
      this.modelData.leftArmGroup.position.set(0.10, 1.35, 0.35);
      this.modelData.leftArmGroup.rotation.set(0.1, 0, 0);
    } else {
      // Return arm poses smoothly to sides
      this.modelData.leftArmGroup.position.lerp(new THREE.Vector3(0.35, 1.35, 0), 10 * delta);
      this.modelData.leftArmGroup.rotation.x *= 0.8;
      this.modelData.leftArmGroup.rotation.y *= 0.8;
      this.modelData.leftArmGroup.rotation.z *= 0.8;
      this.modelData.rightArmGroup.rotation.x *= 0.8;
      this.modelData.rightArmGroup.rotation.y *= 0.8;
      this.modelData.rightArmGroup.rotation.z *= 0.8;
      this.modelData.rightArmGroup.position.lerp(new THREE.Vector3(-0.35, 1.35, 0), 10 * delta);
    }

    // 6. Camera Position (Smooth 3rd-Person Orbit & Shoulder-Offset)
    this.updateCamera(delta);
  }

  updateCamera(delta) {
    const targetDist = this.isAimingPilum ? 2.5 : this.cameraDistance;

    // Camera offset rotated by yaw
    const camOffsetRot = this.cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    // Camera position behind player according to yaw and pitch
    const backVec = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(-this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    ).multiplyScalar(targetDist);

    const idealCamPos = this.position.clone().add(camOffsetRot).add(backVec);

    // Prevent camera from dipping through ground or below wall floor
    const minHeight = this.calculateTerrainHeight(idealCamPos.x, idealCamPos.z) + 0.6;
    if (idealCamPos.y < minHeight) {
      idealCamPos.y = minHeight;
    }

    this.camera.position.lerp(idealCamPos, Math.min(1.0, 18 * delta));

    // Look at target: player chest/head plus shoulder offset
    const lookTarget = this.position.clone().add(new THREE.Vector3(0, 1.7, 0)).add(camOffsetRot.clone().multiplyScalar(0.4));
    this.camera.lookAt(lookTarget);
  }
}
