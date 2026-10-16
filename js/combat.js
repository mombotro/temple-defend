import * as THREE from 'three';
import { createPilumMesh, createRampartBoulder } from './models.js';
import { soundEngine } from './audio.js';

export class CombatSystem {
  constructor(scene, camera, player, enemyManager) {
    this.scene = scene;
    this.camera = camera;
    this.player = player;
    this.enemyManager = enemyManager;

    this.playerPila = [];
    this.boulders = [];
    this.arrowVolleys = [];
    this.particles = [];

    // Interactive wall boulder racks (stationed on open ramparts and directly above the central gate)
    this.boulderRacks = [
      { pos: new THREE.Vector3(-26, 7.2, 2.2), available: true, respawnTimer: 0 },
      { pos: new THREE.Vector3(-16, 7.2, 2.2), available: true, respawnTimer: 0 },
      { pos: new THREE.Vector3(0, 7.2, 2.2), available: true, respawnTimer: 0 }, // Directly above the oak gate doors!
      { pos: new THREE.Vector3(16, 7.2, 2.2), available: true, respawnTimer: 0 },
      { pos: new THREE.Vector3(26, 7.2, 2.2), available: true, respawnTimer: 0 }
    ];

    this.boulderMeshes = [];
    this.setupBoulderRacks();

    // Hook player callbacks
    this.player.onThrowPilumCallback = (origin, dir, isFlaming) => {
      this.spawnPlayerPilum(origin, dir, isFlaming);
    };

    this.player.onArrowVolleyCallback = (targetPos) => {
      this.triggerArrowVolley(targetPos);
    };

    this.player.onBlockCallback = (pos) => {
      this.spawnFloatingText("🛡️ BLOCKED!", pos.clone().add(new THREE.Vector3(0, 2.0, 0)), 'text-block');
      this.spawnHitSparks(pos.clone().add(new THREE.Vector3(0, 1.4, 0.4)), 0x64b5f6);
    };
  }

  setupBoulderRacks() {
    this.boulderRacks.forEach(rack => {
      const mesh = createRampartBoulder();
      mesh.position.copy(rack.pos);
      this.scene.add(mesh);
      this.boulderMeshes.push(mesh);
    });
  }

  // --- 1. PLAYER MELEE HIT DETECTION ---
  checkMeleeHits() {
    if (!this.player.isAttacking) return;

    // Check during the active slicing frames of the swing (15% to 85% of duration)
    const progress = Math.min(1.0, this.player.attackTimer / this.player.attackDuration);
    if (progress < 0.15 || progress > 0.85) return;

    const hitRange = 3.8; // Generous reach for Roman Gladius sword & shield bash
    const playerPos = this.player.position;

    // Use camera world direction so attacks ALWAYS align with where player aims on screen!
    const playerFacing = new THREE.Vector3();
    this.camera.getWorldDirection(playerFacing);
    playerFacing.y = 0;
    playerFacing.normalize();

    // Base damage based on combo strike
    let baseDamage = 35;
    let isCrit = false;
    let isStun = false;

    if (this.player.comboIndex === 1) {
      baseDamage = 35; // Slash
    } else if (this.player.comboIndex === 2) {
      baseDamage = 20; // Shield Bash
      isStun = true;
    } else {
      baseDamage = 65; // Heavy Thrust
      isCrit = true;
    }

    baseDamage *= this.player.upgrades.gladiusDamageMult;
    if (this.player.warcryActive) baseDamage *= 1.5;

    let hitCount = 0;

    // Check hit against Greek enemies
    this.enemyManager.enemies.forEach(enemy => {
      if (enemy.state === 'dead') return;
      if (this.player.hitEnemiesThisSwing && this.player.hitEnemiesThisSwing.has(enemy)) return;

      const toEnemy = enemy.position.clone().sub(playerPos);
      const horizontalDist = Math.sqrt(toEnemy.x * toEnemy.x + toEnemy.z * toEnemy.z);
      const verticalDiff = Math.abs(toEnemy.y);

      // Check distance (both horizontal reach and elevation allowance for ladder climbers)
      if (horizontalDist <= hitRange && verticalDiff <= 3.4) {
        const horizontalDir = new THREE.Vector3(toEnemy.x, 0, toEnemy.z).normalize();
        const dot = playerFacing.dot(horizontalDir);

        // Hit if enemy is in front of the camera (wide 165-degree sweep) OR close (point-blank)
        if (dot > 0.12 || horizontalDist <= 1.8) {
          if (this.player.hitEnemiesThisSwing) {
            this.player.hitEnemiesThisSwing.add(enemy);
          }

          this.enemyManager.damageEnemy(enemy, baseDamage, isCrit, playerFacing);
          this.spawnHitSparks(enemy.position.clone().add(new THREE.Vector3(0, 1.2, 0)), isCrit ? 0xffea00 : 0xcc2222);
          this.spawnFloatingText(`-${Math.round(baseDamage)}`, enemy.position, isCrit ? 'text-crit' : 'text-damage');
          hitCount++;

          if (isStun) {
            enemy.attackTimer = -this.player.upgrades.shieldStunDuration;
          }
        }
      }
    });

    // Check hit against Battering Rams
    this.enemyManager.batteringRams.forEach(ram => {
      if (ram.isDestroyed) return;
      if (this.player.hitEnemiesThisSwing && this.player.hitEnemiesThisSwing.has(ram)) return;

      const toRam = ram.position.clone().sub(playerPos);
      const horizontalDist = Math.sqrt(toRam.x * toRam.x + toRam.z * toRam.z);
      if (horizontalDist < 4.8 && Math.abs(toRam.y) < 3.5) {
        if (this.player.hitEnemiesThisSwing) {
          this.player.hitEnemiesThisSwing.add(ram);
        }
        ram.health -= baseDamage;
        this.spawnHitSparks(ram.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xff8800);
        soundEngine.playSwordHit();
        if (ram.health <= 0) {
          ram.isDestroyed = true;
          this.scene.remove(ram.mesh);
          this.spawnFloatingText("RAM DESTROYED!", ram.position, 'text-gold');
        }
      }
    });

    if (hitCount > 0) {
      soundEngine.playSwordHit(isCrit);
    }
  }

  // --- 2. PLAYER PILUM (JAVELIN) ---
  spawnPlayerPilum(origin, direction, isFlaming = false) {
    const mesh = createPilumMesh();
    mesh.position.copy(origin);
    this.scene.add(mesh);

    const speed = 28;
    const velocity = direction.clone().multiplyScalar(speed);
    velocity.y += 1.8; // Slight initial loft

    this.playerPila.push({
      mesh,
      position: origin,
      velocity,
      isFlaming,
      life: 5.0,
      damage: 130 * this.player.upgrades.gladiusDamageMult
    });
  }

  // --- 3. RAMPART BOULDER ROLL ---
  dropBoulderAtRack(rackIndex) {
    const rack = this.boulderRacks[rackIndex];
    if (!rack || !rack.available) return;

    rack.available = false;
    rack.respawnTimer = 10.0;
    this.boulderMeshes[rackIndex].visible = false;

    soundEngine.playSwordSwing();

    // Spawn falling rolling boulder
    const mesh = createRampartBoulder();
    mesh.position.copy(rack.pos);
    mesh.scale.set(1.4, 1.4, 1.4);
    this.scene.add(mesh);

    this.boulders.push({
      mesh,
      position: mesh.position,
      velocity: new THREE.Vector3(0, 0, 4.5), // Pushed forward over parapet
      active: true,
      damage: 220
    });
  }

  // Get nearest boulder rack
  getNearbyBoulderRack(playerPos, maxDist = 2.8) {
    for (let i = 0; i < this.boulderRacks.length; i++) {
      const rack = this.boulderRacks[i];
      if (rack.available && playerPos.distanceTo(rack.pos) <= maxDist) {
        return i;
      }
    }
    return -1;
  }

  // --- 4. TACTICAL ROMAN ARROW VOLLEY ---
  triggerArrowVolley(centerPos) {
    const arrowCount = 18;
    for (let i = 0; i < arrowCount; i++) {
      setTimeout(() => {
        const offset = new THREE.Vector3((Math.random() - 0.5) * 16, 25, (Math.random() - 0.5) * 12);
        const spawnPos = centerPos.clone().add(offset);
        const targetPos = centerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 14, 0, (Math.random() - 0.5) * 10));

        const arrowGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6);
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const mesh = new THREE.Mesh(arrowGeo, arrowMat);
        mesh.position.copy(spawnPos);
        this.scene.add(mesh);

        const velocity = targetPos.clone().sub(spawnPos).normalize().multiplyScalar(32);

        this.arrowVolleys.push({
          mesh,
          position: spawnPos,
          velocity,
          targetPos,
          damage: 55,
          active: true
        });
      }, i * 65);
    }
  }

  // --- 5. PARTICLE EFFECTS ---
  spawnHitSparks(pos, colorHex = 0xffd700) {
    for (let i = 0; i < 8; i++) {
      const pGeo = new THREE.SphereGeometry(0.06, 4, 4);
      const pMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(pos);
      this.scene.add(p);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 4
      );

      this.particles.push({ mesh: p, velocity: vel, life: 0.35 });
    }
  }

  spawnExplosion(pos) {
    soundEngine.playBoulderCrash();
    for (let i = 0; i < 20; i++) {
      const pGeo = new THREE.DodecahedronGeometry(0.18, 0);
      const pMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff5500 : 0xffaa00 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(pos);
      this.scene.add(p);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8
      );

      this.particles.push({ mesh: p, velocity: vel, life: 0.6 });
    }
  }

  spawnFloatingText(text, worldPos, cssClass = 'text-damage') {
    const el = document.createElement('div');
    el.className = `floating-text ${cssClass}`;
    el.textContent = text;
    document.body.appendChild(el);

    // Screen projection update in loop or auto-remove
    const updatePos = () => {
      const screenPos = worldPos.clone().add(new THREE.Vector3(0, 1.8, 0)).project(this.camera);
      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    };
    updatePos();

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 800);
  }

  // --- UPDATE LOOP ---
  update(delta) {
    // 1. Check Melee Attacks
    this.checkMeleeHits();

    // 2. Boulder Racks Respawn
    this.boulderRacks.forEach((rack, idx) => {
      if (!rack.available) {
        rack.respawnTimer -= delta;
        if (rack.respawnTimer <= 0) {
          rack.available = true;
          this.boulderMeshes[idx].visible = true;
        }
      }
    });

    // 3. Update Boulders
    this.boulders.forEach((boulder, bIdx) => {
      if (!boulder.active) return;

      boulder.velocity.y -= 20 * delta; // Gravity
      boulder.position.addScaledVector(boulder.velocity, delta);
      boulder.mesh.position.copy(boulder.position);
      boulder.mesh.rotation.x += delta * 6;

      // Check hit ground or enemies
      if (boulder.position.y <= 0.6) {
        boulder.active = false;
        soundEngine.playBoulderCrash();
        this.spawnExplosion(boulder.position);

        // AOE damage to all nearby Greek attackers
        this.enemyManager.enemies.forEach(enemy => {
          if (enemy.state === 'dead') return;
          const dist = enemy.position.distanceTo(boulder.position);
          if (dist <= 6.5) {
            const aoeDmg = boulder.damage * (1 - dist / 6.5);
            this.enemyManager.damageEnemy(enemy, aoeDmg, true, enemy.position.clone().sub(boulder.position));
            this.spawnFloatingText(`-${Math.round(aoeDmg)}`, enemy.position, 'text-crit');
          }
        });

        // Damage Battering Ram if nearby
        this.enemyManager.batteringRams.forEach(ram => {
          if (!ram.isDestroyed && ram.position.distanceTo(boulder.position) < 7.0) {
            ram.health -= boulder.damage;
            if (ram.health <= 0) {
              ram.isDestroyed = true;
              this.scene.remove(ram.mesh);
              this.spawnFloatingText("RAM CRUSHED!", ram.position, 'text-gold');
            }
          }
        });

        setTimeout(() => {
          this.scene.remove(boulder.mesh);
          this.boulders.splice(bIdx, 1);
        }, 100);
      }
    });

    // 4. Update Player Pila (Javelins)
    this.playerPila.forEach((pilum, pIdx) => {
      pilum.life -= delta;
      pilum.velocity.y -= 9.8 * delta; // Gravity
      pilum.position.addScaledVector(pilum.velocity, delta);
      pilum.mesh.position.copy(pilum.position);

      // Face trajectory
      pilum.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pilum.velocity.clone().normalize());

      // Check hit Greek enemies
      for (const enemy of this.enemyManager.enemies) {
        if (enemy.state === 'dead') continue;
        if (pilum.position.distanceTo(enemy.position.clone().add(new THREE.Vector3(0, 1.2, 0))) < 1.4) {
          const isCrit = true;
          this.enemyManager.damageEnemy(enemy, pilum.damage, isCrit, pilum.velocity.clone().normalize());
          this.spawnFloatingText(`PIERCE -${Math.round(pilum.damage)}!`, enemy.position, 'text-crit');

          if (pilum.isFlaming) {
            this.spawnExplosion(pilum.position);
            // Splashing fire damage
            this.enemyManager.enemies.forEach(nearby => {
              if (nearby !== enemy && nearby.position.distanceTo(pilum.position) < 5.0) {
                this.enemyManager.damageEnemy(nearby, 60, false);
                this.spawnFloatingText("-60 FIRE", nearby.position, 'text-crit');
              }
            });
          }

          this.scene.remove(pilum.mesh);
          this.playerPila.splice(pIdx, 1);
          return;
        }
      }

      // Check hit ground / wall or expired
      if (pilum.position.y <= 0 || pilum.life <= 0) {
        this.scene.remove(pilum.mesh);
        this.playerPila.splice(pIdx, 1);
      }
    });

    // 5. Update Arrow Volleys
    this.arrowVolleys.forEach((arrow, aIdx) => {
      if (!arrow.active) return;
      arrow.position.addScaledVector(arrow.velocity, delta);
      arrow.mesh.position.copy(arrow.position);

      // Check hit enemy or ground
      if (arrow.position.y <= 0.2) {
        arrow.active = false;
        this.scene.remove(arrow.mesh);
        this.arrowVolleys.splice(aIdx, 1);
        return;
      }

      for (const enemy of this.enemyManager.enemies) {
        if (enemy.state === 'dead') continue;
        if (arrow.position.distanceTo(enemy.position.clone().add(new THREE.Vector3(0, 1.0, 0))) < 1.2) {
          arrow.active = false;
          this.enemyManager.damageEnemy(enemy, arrow.damage, false);
          this.spawnFloatingText(`-${arrow.damage}`, enemy.position, 'text-damage');
          this.scene.remove(arrow.mesh);
          this.arrowVolleys.splice(aIdx, 1);
          return;
        }
      }
    });

    // 6. Update Particle Systems
    this.particles.forEach((p, idx) => {
      p.life -= delta;
      p.velocity.y -= 12 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.scale.multiplyScalar(0.92);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(idx, 1);
      }
    });
  }
}
