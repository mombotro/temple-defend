import * as THREE from 'three';
import { createRomanLegionary } from './models.js?v=2.2';
import { soundEngine } from './audio.js?v=2.2';

export class AlliedForces {
  constructor(scene, enemyManager) {
    this.scene = scene;
    this.enemyManager = enemyManager;

    this.allies = [];
    this.arrows = [];
    this.isTestudoActive = false;
    this.testudoTimer = 0;

    this.setupRampartArchers();
    this.setupGateDefenders();
  }

  setupRampartArchers() {
    // Station archers along the high battlements and towers
    const archerPositions = [
      [-28, 7.2, 1.2],
      [-16, 7.2, 1.2],
      [16, 7.2, 1.2],
      [28, 7.2, 1.2],
      [-8, 10.2, 0], // High Tower Left
      [8, 10.2, 0]   // High Tower Right
    ];

    archerPositions.forEach(pos => {
      const data = createRomanLegionary(true);
      data.root.position.set(...pos);
      data.root.rotation.y = Math.PI; // Face outwards toward battlefield
      this.scene.add(data.root);

      this.allies.push({
        type: 'archer',
        data,
        mesh: data.root,
        position: data.root.position,
        shootCooldown: 3.0 + Math.random() * 2.0,
        shootTimer: Math.random() * 2.0
      });
    });
  }

  addExtraArchers(count) {
    for (let i = 0; i < count; i++) {
      const x = -34 + i * 20;
      const data = createRomanLegionary(true);
      data.root.position.set(x, 7.2, 1.2);
      data.root.rotation.y = Math.PI;
      this.scene.add(data.root);

      this.allies.push({
        type: 'archer',
        data,
        mesh: data.root,
        position: data.root.position,
        shootCooldown: 2.8,
        shootTimer: Math.random() * 2.0
      });
    }
  }

  setupGateDefenders() {
    // 4 Roman Legionaries stationed at the gate
    const gatePositions = [
      [-3.5, 0, 1.5],
      [-1.5, 0, 1.8],
      [1.5, 0, 1.8],
      [3.5, 0, 1.5]
    ];

    gatePositions.forEach(pos => {
      const data = createRomanLegionary(false);
      data.root.position.set(...pos);
      data.root.rotation.y = Math.PI;
      this.scene.add(data.root);

      this.allies.push({
        type: 'infantry',
        data,
        mesh: data.root,
        position: data.root.position,
        basePos: new THREE.Vector3(...pos),
        attackTimer: 0,
        health: 120
      });
    });
  }

  activateTestudo() {
    this.isTestudoActive = true;
    this.testudoTimer = 15.0; // 15 seconds duration

    // Move gate legionaries into tight interlocking formation
    const infantry = this.allies.filter(a => a.type === 'infantry');
    infantry.forEach((inf, idx) => {
      inf.mesh.position.set(-2.0 + idx * 1.3, 0, 2.5);
      // Raise shields high into testudo roof / wall
      if (inf.data && inf.data.armL) {
        inf.data.armL.position.set(0.1, 1.5, 0.4);
        inf.data.armL.rotation.set(-0.2, 0.4, 0.1);
      }
    });
  }

  update(delta) {
    // 1. Testudo Timer
    if (this.isTestudoActive) {
      this.testudoTimer -= delta;
      if (this.testudoTimer <= 0) {
        this.isTestudoActive = false;
        // Reset positions
        const infantry = this.allies.filter(a => a.type === 'infantry');
        infantry.forEach(inf => {
          inf.mesh.position.copy(inf.basePos);
          if (inf.data && inf.data.armL) {
            inf.data.armL.position.set(0.32, 1.25, 0);
            inf.data.armL.rotation.set(0, 0, 0);
          }
        });
      }
    }

    // 2. Archers Target and Shoot
    this.allies.forEach(ally => {
      if (ally.type === 'archer') {
        ally.shootTimer += delta;
        if (ally.shootTimer >= ally.shootCooldown) {
          // Find nearest Greek enemy in range
          let target = null;
          let minDist = 45;

          for (const enemy of this.enemyManager.enemies) {
            if (enemy.state === 'dead') continue;
            const dist = ally.position.distanceTo(enemy.position);
            if (dist < minDist && enemy.position.z > 2.0) {
              minDist = dist;
              target = enemy;
            }
          }

          if (target) {
            ally.shootTimer = 0;
            this.fireRomanArrow(ally.position, target.position);

            // Bow draw animation
            if (ally.data && ally.data.armR) {
              ally.data.armR.position.z = -0.3;
              setTimeout(() => {
                if (ally.data && ally.data.armR) ally.data.armR.position.z = 0;
              }, 200);
            }
          }
        }
      }

      // Gate Infantry Melee
      if (ally.type === 'infantry') {
        ally.attackTimer += delta;
        // Check for enemies attacking the gate
        const nearbyEnemy = this.enemyManager.enemies.find(e => 
          e.state !== 'dead' && e.position.distanceTo(ally.position) < 3.2
        );

        if (nearbyEnemy && ally.attackTimer >= 1.8) {
          ally.attackTimer = 0;
          soundEngine.playSwordHit();
          this.enemyManager.damageEnemy(nearbyEnemy, 28, false);

          if (ally.data && ally.data.armR) {
            ally.data.armR.rotation.x = Math.PI / 3;
            setTimeout(() => {
              if (ally.data && ally.data.armR) ally.data.armR.rotation.x = 0;
            }, 200);
          }
        }
      }
    });

    // 3. Update Roman Arrows
    this.arrows.forEach((arr, idx) => {
      arr.life -= delta;
      arr.velocity.y -= 14 * delta;
      arr.position.addScaledVector(arr.velocity, delta);
      arr.mesh.position.copy(arr.position);
      arr.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arr.velocity.clone().normalize());

      // Check hit enemy
      for (const enemy of this.enemyManager.enemies) {
        if (enemy.state === 'dead') continue;
        if (arr.position.distanceTo(enemy.position.clone().add(new THREE.Vector3(0, 1.2, 0))) < 1.2) {
          this.enemyManager.damageEnemy(enemy, arr.damage, false);
          this.scene.remove(arr.mesh);
          this.arrows.splice(idx, 1);
          return;
        }
      }

      if (arr.position.y <= 0 || arr.life <= 0) {
        this.scene.remove(arr.mesh);
        this.arrows.splice(idx, 1);
      }
    });
  }

  fireRomanArrow(fromPos, toPos) {
    const spawnPos = fromPos.clone().add(new THREE.Vector3(0, 1.4, 0.4));
    const toTarget = toPos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(spawnPos);
    const dist = toTarget.length();

    const velocity = toTarget.clone().normalize().multiplyScalar(28);
    velocity.y += dist * 0.16; // Trajectory arc

    const arrowGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.7, 6);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });
    const mesh = new THREE.Mesh(arrowGeo, arrowMat);
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    this.arrows.push({
      mesh,
      position: spawnPos,
      velocity,
      damage: 32,
      life: 3.5
    });
  }
}
