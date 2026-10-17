import * as THREE from 'three';
import { 
  createGreekHoplite, 
  createGreekPeltast, 
  createGreekArcher, 
  createAssaultLadder, 
  createBatteringRamMesh 
} from './models.js?v=2.4';
import { soundEngine } from './audio.js?v=2.4';

export class EnemyManager {
  constructor(scene, player, templeFortress) {
    this.scene = scene;
    this.player = player;
    this.temple = templeFortress;

    this.enemies = [];
    this.ladders = [];
    this.projectiles = []; // Arrows, javelins thrown by Greeks
    this.batteringRams = [];

    // Wave status
    this.currentWave = 1;
    this.waveTotalEnemies = 0;
    this.waveEnemiesRemaining = 0;
    this.waveActive = false;
    this.spawnQueue = [];
    this.spawnTimer = 0;

    // Callbacks
    this.onEnemyKilled = null;
    this.onWaveComplete = null;
    this.onGateDamage = null;
    this.onWallDamage = null;
  }

  startWave(waveNumber) {
    this.currentWave = waveNumber;
    this.waveActive = true;
    this.spawnQueue = [];
    this.spawnTimer = 0;

    // Clean up any lingering ladders or destroyed rams from previous wave
    for (let i = this.ladders.length - 1; i >= 0; i--) {
      this.scene.remove(this.ladders[i].mesh);
    }
    this.ladders = [];

    for (let i = this.batteringRams.length - 1; i >= 0; i--) {
      this.scene.remove(this.batteringRams[i].mesh);
    }
    this.batteringRams = [];

    // Define wave composition (ONLY ACTUAL COMBAT TARGETS COUNTED IN THE HUD!)
    if (waveNumber === 1) {
      // Wave 1: Vanguard Skirmishers (14 enemies)
      for (let i = 0; i < 8; i++) this.spawnQueue.push('peltast');
      for (let i = 0; i < 6; i++) this.spawnQueue.push('hoplite');
    } else if (waveNumber === 2) {
      // Wave 2: Phalanx & First Ladders (20 enemies)
      this.setupAssaultLadder(-22);
      this.setupAssaultLadder(22);
      for (let i = 0; i < 10; i++) this.spawnQueue.push('hoplite');
      for (let i = 0; i < 6; i++) this.spawnQueue.push('peltast');
      for (let i = 0; i < 4; i++) this.spawnQueue.push('archer');
    } else if (waveNumber === 3) {
      // Wave 3: Heavier assault + Battering Ram! (29 targets: 28 soldiers + 1 ram)
      this.setupAssaultLadder(-26);
      this.setupAssaultLadder(26);
      for (let i = 0; i < 14; i++) this.spawnQueue.push('hoplite');
      for (let i = 0; i < 8; i++) this.spawnQueue.push('archer');
      for (let i = 0; i < 6; i++) this.spawnQueue.push('peltast');
      // Ram rolls out early alongside the advancing soldiers
      this.spawnQueue.splice(4, 0, 'ram');
    } else if (waveNumber === 4) {
      // Wave 4: Full scale siege (37 targets: 36 soldiers + 1 ram)
      this.setupAssaultLadder(-28);
      this.setupAssaultLadder(18);
      this.setupAssaultLadder(28);
      for (let i = 0; i < 18; i++) this.spawnQueue.push('hoplite');
      for (let i = 0; i < 10; i++) this.spawnQueue.push('archer');
      for (let i = 0; i < 8; i++) this.spawnQueue.push('peltast');
      this.spawnQueue.splice(6, 0, 'ram');
    } else {
      // Wave 5: Spartan Champion Boss & Grand Greek Army (40 targets: 38 soldiers + 1 ram + Boss)
      this.setupAssaultLadder(-24);
      this.setupAssaultLadder(24);
      for (let i = 0; i < 20; i++) this.spawnQueue.push('hoplite');
      for (let i = 0; i < 10; i++) this.spawnQueue.push('archer');
      for (let i = 0; i < 8; i++) this.spawnQueue.push('peltast');
      this.spawnQueue.splice(8, 0, 'ram');
      this.spawnQueue.push('boss');
    }

    // Only count actual killable targets (soldiers + rams + boss)
    this.waveTotalEnemies = this.spawnQueue.filter(t => t !== 'ladder').length;
    this.waveEnemiesRemaining = this.waveTotalEnemies;
  }

  spawnEnemy(type) {
    // Spawn positions in the battlefield in front of the wall (z = 40 to 60)
    const spawnX = (Math.random() - 0.5) * 60;
    const spawnZ = 42 + Math.random() * 20;

    if (type === 'ladder') {
      this.setupAssaultLadder(spawnX);
      return;
    }

    if (type === 'ram') {
      this.setupBatteringRam();
      return;
    }

    let enemy = {
      type: type,
      position: new THREE.Vector3(spawnX, 0, spawnZ),
      velocity: new THREE.Vector3(),
      health: type === 'boss' ? 500 : (type === 'hoplite' ? 85 : (type === 'peltast' ? 55 : 45)),
      maxHealth: type === 'boss' ? 500 : (type === 'hoplite' ? 85 : (type === 'peltast' ? 55 : 45)),
      speed: type === 'boss' ? 4.2 : (type === 'peltast' ? 5.8 : (type === 'hoplite' ? 4.5 : 4.0)),
      state: 'advancing', // 'advancing', 'climbing', 'attacking_gate', 'melee_player', 'ranged_attack', 'dead'
      attackCooldown: 1.5 + Math.random() * 1.0,
      attackTimer: 0,
      climbProgress: 0,
      assignedLadder: null,
      targetPos: new THREE.Vector3(0, 0, 0),
      animTime: Math.random() * 10
    };

    if (type === 'hoplite') {
      enemy.modelData = createGreekHoplite(false);
    } else if (type === 'boss') {
      enemy.modelData = createGreekHoplite(true);
    } else if (type === 'peltast') {
      enemy.modelData = createGreekPeltast();
    } else if (type === 'archer') {
      enemy.modelData = createGreekArcher();
    }

    enemy.mesh = enemy.modelData.root;
    enemy.mesh.position.copy(enemy.position);
    this.scene.add(enemy.mesh);
    this.enemies.push(enemy);
  }

  setupAssaultLadder(targetX) {
    // Clamp ladder X along the open wall sections (excluding gate and bastion towers: |x| >= 14, |x| <= 34)
    let ladderX = targetX;
    if (Math.abs(ladderX) < 14) ladderX = (ladderX < 0 ? -18 : 18);
    ladderX = Math.max(-34, Math.min(34, ladderX));

    const ladderMesh = createAssaultLadder();
    // Position ladder leaning against the front of the wall
    ladderMesh.position.set(ladderX, 0, 3.2);
    ladderMesh.rotation.x = -0.16; // Leans back against parapet at y=7.2, z=2.2
    this.scene.add(ladderMesh);

    const ladderObj = {
      mesh: ladderMesh,
      x: ladderX,
      z: 3.2,
      isPushedDown: false,
      fallTimer: 0
    };
    this.ladders.push(ladderObj);

    // Announce ladder assault
    soundEngine.playLadderPush();
  }

  setupBatteringRam() {
    const ramMesh = createBatteringRamMesh();
    ramMesh.position.set(0, 0, 48); // Approaches center gate (x=0)
    this.scene.add(ramMesh);

    const ramObj = {
      mesh: ramMesh,
      position: ramMesh.position,
      health: 280,
      maxHealth: 280,
      speed: 2.2,
      isAtGate: false,
      ramTimer: 0,
      isDestroyed: false
    };
    this.batteringRams.push(ramObj);
  }

  destroyRam(ram) {
    if (ram.isDestroyed) return;
    ram.isDestroyed = true;
    this.scene.remove(ram.mesh);

    // Remove from array so wave completion check can pass!
    const idx = this.batteringRams.indexOf(ram);
    if (idx !== -1) {
      this.batteringRams.splice(idx, 1);
    }

    this.waveEnemiesRemaining = Math.max(0, this.waveEnemiesRemaining - 1);
    soundEngine.playBoulderCrash();

    if (this.onEnemyKilled) {
      this.onEnemyKilled({ type: 'ram', position: ram.position }, true);
    }
  }

  pushLadderDown(ladder) {
    if (ladder.isPushedDown) return;
    ladder.isPushedDown = true;
    soundEngine.playLadderPush();

    // Defeat all enemies currently climbing this ladder
    this.enemies.forEach(e => {
      if (e.assignedLadder === ladder && e.state === 'climbing') {
        this.damageEnemy(e, 9999, true);
      }
    });
  }

  // Find nearest interactive ladder to player
  getNearbyLadder(playerPos, maxDist = 3.5) {
    for (const ladder of this.ladders) {
      if (ladder.isPushedDown) continue;
      // Parapet top is at z = 2.2, y = 7.2
      const topPos = new THREE.Vector3(ladder.x, 7.2, 2.2);
      if (playerPos.distanceTo(topPos) <= maxDist) {
        return ladder;
      }
    }
    return null;
  }

  damageEnemy(enemy, amount, isCrit = false, knockbackDir = null) {
    if (enemy.state === 'dead') return;

    enemy.health -= amount;
    soundEngine.playSwordHit(isCrit);

    // Apply knockback
    if (knockbackDir) {
      enemy.position.addScaledVector(knockbackDir.clone().setY(0).normalize(), isCrit ? 2.2 : 1.2);
    }

    if (enemy.health <= 0) {
      enemy.state = 'dead';
      this.waveEnemiesRemaining = Math.max(0, this.waveEnemiesRemaining - 1);
      if (this.onEnemyKilled) this.onEnemyKilled(enemy, isCrit);

      // Death animation
      enemy.mesh.rotation.x = Math.PI / 2;
      setTimeout(() => {
        this.scene.remove(enemy.mesh);
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) this.enemies.splice(idx, 1);
      }, 3000);
    }
  }

  // --- UPDATE LOOP ---
  update(delta) {
    // 1. Spawning from queue
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnTimer += delta;
      if (this.spawnTimer >= 1.4) {
        const nextType = this.spawnQueue.shift();
        this.spawnEnemy(nextType);
        this.spawnTimer = 0;
      }
    }

    // Check if wave finished
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0 && this.batteringRams.length === 0) {
      this.waveActive = false;
      if (this.onWaveComplete) this.onWaveComplete(this.currentWave);
    }

    // 2. Update Ladders
    this.ladders.forEach((ladder, idx) => {
      if (ladder.isPushedDown) {
        ladder.fallTimer += delta;
        ladder.mesh.rotation.x += delta * 1.8;
        if (ladder.fallTimer >= 2.0) {
          this.scene.remove(ladder.mesh);
          this.ladders.splice(idx, 1);
        }
      }
    });

    // 3. Update Battering Rams
    this.batteringRams.forEach((ram, idx) => {
      if (ram.isDestroyed) return;

      if (!ram.isAtGate) {
        // Move towards center gate at (0, 0, 3.2)
        ram.position.z -= ram.speed * delta;
        if (ram.position.z <= 3.8) {
          ram.position.z = 3.8;
          ram.isAtGate = true;
        }
      } else {
        // Ramming Gate
        ram.ramTimer += delta;
        if (ram.ramTimer >= 3.8) {
          ram.ramTimer = 0;
          soundEngine.playBoulderCrash();
          if (this.onGateDamage) this.onGateDamage(35);
        }
      }
    });

    // 4. Update Greek Enemies
    const playerPos = this.player.position;

    this.enemies.forEach(enemy => {
      if (enemy.state === 'dead') return;

      enemy.animTime += delta * 8;
      enemy.attackTimer += delta;

      // Leg swing animation
      if (enemy.modelData && enemy.modelData.legLGroup) {
        const legSwing = Math.sin(enemy.animTime) * 0.55;
        enemy.modelData.legLGroup.rotation.x = legSwing;
        enemy.modelData.legRGroup.rotation.x = -legSwing;
      }

      // STATE MACHINE:
      // A. Advancing across battlefield
      if (enemy.state === 'advancing') {
        // Check if there is an active ladder nearby to climb
        if (enemy.type === 'hoplite') {
          const availableLadder = this.ladders.find(l => !l.isPushedDown && Math.abs(l.x - enemy.position.x) < 18);
          if (availableLadder && Math.random() < 0.7) {
            enemy.assignedLadder = availableLadder;
            enemy.targetPos.set(availableLadder.x, 0, availableLadder.z);
          } else {
            // Target the gate
            enemy.targetPos.set((Math.random() - 0.5) * 6, 0, 3.2);
          }
        } else if (enemy.type === 'boss') {
          // Boss targets the gate to smash through
          enemy.targetPos.set(0, 0, 3.5);
        } else if (enemy.type === 'peltast' || enemy.type === 'archer') {
          // Skirmishers stop at range (14 to 28m from wall)
          enemy.targetPos.set(enemy.position.x, 0, 16 + Math.random() * 10);
        }

        // Move toward targetPos
        const toTarget = enemy.targetPos.clone().sub(enemy.position);
        toTarget.y = 0;
        const dist = toTarget.length();

        if (dist > 1.2) {
          toTarget.normalize();
          enemy.position.addScaledVector(toTarget, enemy.speed * delta);
          enemy.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        } else {
          // Reached target: transition state
          if (enemy.assignedLadder && !enemy.assignedLadder.isPushedDown) {
            enemy.state = 'climbing';
            enemy.climbProgress = 0;
          } else if (enemy.type === 'hoplite' || enemy.type === 'boss') {
            enemy.state = 'attacking_gate';
          } else {
            enemy.state = 'ranged_attack';
          }
        }
      }

      // B. Climbing Assault Ladder
      else if (enemy.state === 'climbing') {
        if (!enemy.assignedLadder || enemy.assignedLadder.isPushedDown) {
          enemy.state = 'advancing';
          enemy.assignedLadder = null;
          return;
        }

        enemy.climbProgress += delta * 0.35; // Takes ~3s to climb
        enemy.position.y = enemy.climbProgress * 7.2;
        enemy.position.x = enemy.assignedLadder.x;
        enemy.position.z = THREE.MathUtils.lerp(enemy.assignedLadder.z, 2.0, enemy.climbProgress);

        if (enemy.climbProgress >= 1.0) {
          // Successfully mounted the parapet wall!
          enemy.position.set(enemy.assignedLadder.x, 7.2, 1.8);
          enemy.state = 'melee_player';
        }
      }

      // C. Attacking Central Gate
      else if (enemy.state === 'attacking_gate') {
        if (enemy.attackTimer >= enemy.attackCooldown) {
          enemy.attackTimer = 0;
          soundEngine.playSwordHit();
          if (this.onGateDamage) this.onGateDamage(enemy.type === 'boss' ? 22 : 6);

          // Thrust spear animation
          if (enemy.modelData && enemy.modelData.rightArmGroup) {
            enemy.modelData.rightArmGroup.rotation.x = Math.PI / 3;
            setTimeout(() => {
              if (enemy.modelData) enemy.modelData.rightArmGroup.rotation.x = 0;
            }, 250);
          }
        }

        // If player comes down to the gate / courtyard, fight player!
        if (playerPos.y < 3.0 && playerPos.distanceTo(enemy.position) < 14) {
          enemy.state = 'melee_player';
        }
      }

      // D. Close Quarters Melee with Player
      else if (enemy.state === 'melee_player') {
        // If enemy is on the ground but player climbed back up to the wall, resume attacking the gate!
        if (enemy.position.y < 3.0 && playerPos.y > 5.0) {
          enemy.state = (enemy.type === 'peltast' || enemy.type === 'archer') ? 'ranged_attack' : 'attacking_gate';
          return;
        }

        const toPlayer = playerPos.clone().sub(enemy.position);
        const distToPlayer = toPlayer.length();
        const verticalDiff = Math.abs(playerPos.y - enemy.position.y);

        enemy.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        if (distToPlayer > 2.0) {
          toPlayer.y = 0;
          toPlayer.normalize();
          enemy.position.addScaledVector(toPlayer, enemy.speed * delta);

          // Constrain enemies on the ramparts so they don't fall off or float behind the wall
          if (enemy.position.y > 5.0) {
            enemy.position.z = Math.max(-1.6, Math.min(1.8, enemy.position.z));
            enemy.position.x = Math.max(-38.0, Math.min(38.0, enemy.position.x));
          }
        } else {
          // Strike Player (only if within vertical melee reach)
          if (enemy.attackTimer >= enemy.attackCooldown && verticalDiff < 2.5) {
            enemy.attackTimer = 0;
            const dmg = enemy.type === 'boss' ? 32 : 16;
            this.player.takeDamage(dmg, enemy.position);

            // Attack animation
            if (enemy.modelData && enemy.modelData.rightArmGroup) {
              enemy.modelData.rightArmGroup.rotation.x = Math.PI / 2.5;
              setTimeout(() => {
                if (enemy.modelData) enemy.modelData.rightArmGroup.rotation.x = 0;
              }, 200);
            }
          }
        }
      }

      // E. Ranged Attack (Peltasts & Archers)
      else if (enemy.state === 'ranged_attack') {
        const toPlayer = playerPos.clone().sub(enemy.position);
        enemy.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

        if (enemy.attackTimer >= enemy.attackCooldown + 2.0) {
          enemy.attackTimer = 0;
          this.fireEnemyProjectile(enemy, playerPos);
        }
      }

      enemy.mesh.position.copy(enemy.position);
    });

    // 5. Update Greek Projectiles
    this.updateProjectiles(delta);
  }

  fireEnemyProjectile(enemy, targetPos) {
    soundEngine.playPilumThrow();

    const spawnPos = enemy.position.clone().add(new THREE.Vector3(0, 1.5, 0));
    const toTarget = targetPos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(spawnPos);
    const distance = toTarget.length();

    // Arc velocity
    const velocity = toTarget.clone().normalize().multiplyScalar(22);
    velocity.y += distance * 0.22; // Lofted arc

    // Visual arrow / javelin mesh
    const projGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
    const projMat = new THREE.MeshBasicMaterial({ color: 0xff4400 }); // Flaming arrow
    const mesh = new THREE.Mesh(projGeo, projMat);
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      position: spawnPos,
      velocity,
      damage: enemy.type === 'archer' ? 14 : 18,
      life: 4.0
    });
  }

  updateProjectiles(delta) {
    for (let idx = this.projectiles.length - 1; idx >= 0; idx--) {
      const proj = this.projectiles[idx];
      proj.life -= delta;
      proj.velocity.y -= 14 * delta; // Gravity
      proj.position.addScaledVector(proj.velocity, delta);
      proj.mesh.position.copy(proj.position);

      // Face direction of velocity
      proj.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), proj.velocity.clone().normalize());

      // Check hit player
      if (proj.position.distanceTo(this.player.position.clone().add(new THREE.Vector3(0, 1.2, 0))) < 1.2) {
        this.player.takeDamage(proj.damage, proj.position);
        this.scene.remove(proj.mesh);
        this.projectiles.splice(idx, 1);
        continue;
      }

      // Check hit ground / wall or expired
      if (proj.position.y <= 0 || proj.life <= 0) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(idx, 1);
      }
    }
  }
}
