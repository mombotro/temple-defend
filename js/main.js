import * as THREE from 'three';
import { createTempleAndFortress, materials } from './models.js';
import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { CombatSystem } from './combat.js';
import { AlliedForces } from './allies.js';
import { UIManager } from './ui.js';
import { soundEngine } from './audio.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.gameState = 'START'; // 'START', 'PLAYING', 'INTERMISSION', 'VICTORY', 'GAMEOVER'

    // Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb5cbe0); // Mediterranean sky blue
    this.scene.fog = new THREE.FogExp2(0xb5cbe0, 0.009);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 400);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Fortress & Gate Health
    this.fortressData = {
      wallHealth: 100,
      gateHealth: 100
    };

    // Clock
    this.clock = new THREE.Clock();

    // Setup systems
    this.setupLighting();
    this.setupEnvironment();
    this.setupFortress();

    this.player = new Player(this.scene, this.camera, this.canvas);
    this.enemies = new EnemyManager(this.scene, this.player, this.fortressGroup);
    this.allies = new AlliedForces(this.scene, this.enemies);
    this.combat = new CombatSystem(this.scene, this.camera, this.player, this.enemies);
    this.ui = new UIManager(this.player, this.enemies, this.allies, this.fortressData);

    this.setupGameEvents();
    this.setupWindowResize();

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.HemisphereLight(0xfff0dd, 0x556644, 0.85);
    this.scene.add(ambientLight);

    // Warm Mediterranean Sun
    const sunLight = new THREE.DirectionalLight(0xfffae6, 2.2);
    sunLight.position.set(45, 60, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);

    // Subtle blue fill light
    const fillLight = new THREE.DirectionalLight(0x88bbff, 0.4);
    fillLight.position.set(-30, 20, -30);
    this.scene.add(fillLight);
  }

  setupEnvironment() {
    // Ground Plane (Battlefield & Temple Sanctuary)
    const groundGeo = new THREE.PlaneGeometry(260, 260, 32, 32);
    const ground = new THREE.Mesh(groundGeo, materials.groundGrass);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Road leading from Gate (+Z) out to battlefield
    const roadGeo = new THREE.PlaneGeometry(12, 120);
    const road = new THREE.Mesh(roadGeo, materials.dirtRoad);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 60);
    road.receiveShadow = true;
    this.scene.add(road);

    // Distant Greek Encampment Tents & Mountain Peaks
    for (let i = 0; i < 18; i++) {
      const tentGeo = new THREE.ConeGeometry(3.5, 4.0, 4);
      const tentMat = new THREE.MeshStandardMaterial({ color: 0xd9c5a0, roughness: 0.9 });
      const tent = new THREE.Mesh(tentGeo, tentMat);
      const tx = (Math.random() - 0.5) * 140;
      const tz = 75 + Math.random() * 35;
      tent.position.set(tx, 2.0, tz);
      tent.rotation.y = Math.random() * Math.PI;
      this.scene.add(tent);
    }

    // Defensive Wooden Stakes (Cheval de Frise) along road perimeter
    [-18, 18].forEach(sideX => {
      for (let z = 10; z < 45; z += 6) {
        const stakeGeo = new THREE.CylinderGeometry(0.08, 0.12, 2.8, 6);
        const stake = new THREE.Mesh(stakeGeo, materials.greekWood);
        stake.position.set(sideX + (Math.random() - 0.5) * 2, 1.2, z);
        stake.rotation.x = Math.PI / 4;
        stake.rotation.y = (Math.random() - 0.5) * 0.5;
        this.scene.add(stake);
      }
    });
  }

  setupFortress() {
    const templeObj = createTempleAndFortress();
    this.fortressGroup = templeObj.fortressGroup;
    this.gateGroup = templeObj.gateGroup;
    this.brazierLights = templeObj.brazierLights;
    this.scene.add(this.fortressGroup);
  }

  setupGameEvents() {
    // Start Game Button
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      soundEngine.init();
      soundEngine.playWarHorn(1.0);
      soundEngine.startBattleMusic();
      document.getElementById('start-modal').style.display = 'none';
      this.gameState = 'PLAYING';
      this.startWave(1);
    });

    // Next Wave Button in Armory
    document.getElementById('next-wave-btn')?.addEventListener('click', () => {
      soundEngine.playWarHorn(1.1);
      this.ui.hideUpgradeShop();
      this.gameState = 'PLAYING';
      this.startWave(this.enemies.currentWave + 1);
    });

    // Restart Game Buttons
    const restart = () => {
      location.reload();
    };
    document.getElementById('restart-game-btn')?.addEventListener('click', restart);
    document.getElementById('restart-game-vic-btn')?.addEventListener('click', restart);

    // Sound Toggle
    const soundToggle = document.getElementById('sound-toggle');
    soundToggle?.addEventListener('click', () => {
      const isAudible = soundEngine.toggleMute();
      soundToggle.textContent = isAudible ? '🔊 AUDIO ON' : '🔇 AUDIO MUTED';
    });

    // Enemy killed reward
    this.enemies.onEnemyKilled = (enemy, isCrit) => {
      this.player.kills++;
      const valor = enemy.type === 'boss' ? 120 : (enemy.type === 'hoplite' ? 15 : 10);
      this.player.denarii += valor;
      this.combat.spawnFloatingText(`+${valor} 🪙`, enemy.position, 'text-gold');
    };

    // Wave Complete Intermission
    this.enemies.onWaveComplete = (wave) => {
      if (wave >= 5) {
        // Victory!
        this.gameState = 'VICTORY';
        soundEngine.stopBattleMusic();
        soundEngine.playVictory();
        document.getElementById('vic-kills').textContent = this.player.kills;
        document.getElementById('vic-denarii').textContent = this.player.denarii;
        document.getElementById('vic-wall').textContent = `${Math.ceil(this.fortressData.gateHealth)}%`;
        document.getElementById('victory-modal').style.display = 'flex';
        if (document.exitPointerLock) document.exitPointerLock();
      } else {
        // Armory Upgrades screen
        this.gameState = 'INTERMISSION';
        soundEngine.playWarHorn(0.85);
        this.ui.showUpgradeShop(this.player.denarii);
      }
    };

    // Gate Damage handler
    this.enemies.onGateDamage = (amount) => {
      let dmg = amount;
      // Mitigate if Testudo ability is active
      if (this.allies.isTestudoActive) {
        dmg *= 0.2; // 80% reduction
      }
      this.fortressData.gateHealth = Math.max(0, this.fortressData.gateHealth - dmg);

      // Gate shake effect
      this.gateGroup.position.x = (Math.random() - 0.5) * 0.4;
      setTimeout(() => { this.gateGroup.position.x = 0; }, 150);

      if (this.fortressData.gateHealth <= 0) {
        this.triggerGameOver("THE GREEKS BREACHED THE CENTRAL GATE!");
      }
    };

    // Interactive Action Key [E]
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'e' && this.gameState === 'PLAYING') {
        this.handleInteraction();
      }
    });

    // Hook tactical Testudo callback
    this.player.onTestudoCallback = () => {
      this.allies.activateTestudo();
      this.combat.spawnFloatingText("TESTUDO FORMED!", this.gateGroup.position.clone().add(new THREE.Vector3(0, 3, 2)), 'text-block');
    };
  }

  handleInteraction() {
    const playerPos = this.player.position;

    // 1. Check nearby assault ladders
    const nearbyLadder = this.enemies.getNearbyLadder(playerPos, 3.8);
    if (nearbyLadder) {
      this.enemies.pushLadderDown(nearbyLadder);
      this.combat.spawnFloatingText("LADDER TOPPLED!", playerPos, 'text-gold');
      return;
    }

    // 2. Check nearby rampart boulder racks
    const rackIdx = this.combat.getNearbyBoulderRack(playerPos, 3.0);
    if (rackIdx !== -1) {
      this.combat.dropBoulderAtRack(rackIdx);
      this.combat.spawnFloatingText("BOULDER RELEASED!", playerPos, 'text-gold');
      return;
    }
  }

  startWave(waveNum) {
    const waveNames = [
      { title: "WAVE I", sub: "GREEK SKIRMISHERS ADVANCE" },
      { title: "WAVE II", sub: "HOPLITE PHALANX & ASSAULT LADDERS" },
      { title: "WAVE III", sub: "TOXOTAI VOLLEYS & SIEGE ESCALATION" },
      { title: "WAVE IV", sub: "BATTERING RAM TARGETS THE GATE" },
      { title: "WAVE V", sub: "SPARTAN CHAMPION OF ARES MARCHES" }
    ];

    const info = waveNames[waveNum - 1] || { title: `WAVE ${waveNum}`, sub: "THE INVASION CONTINUES" };
    this.ui.showAnnouncement(info.title, info.sub);
    this.enemies.startWave(waveNum);
  }

  triggerGameOver(reason) {
    if (this.gameState === 'GAMEOVER') return;
    this.gameState = 'GAMEOVER';
    soundEngine.stopBattleMusic();
    soundEngine.playDefeat();

    document.getElementById('gameover-reason').textContent = reason;
    document.getElementById('go-waves').textContent = this.enemies.currentWave;
    document.getElementById('go-kills').textContent = this.player.kills;
    document.getElementById('gameover-modal').style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  setupWindowResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // --- ANIMATION / GAME LOOP ---
  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(0.1, this.clock.getDelta());

    // Flickering torch & brazier lights
    if (this.brazierLights) {
      const time = Date.now() * 0.006;
      this.brazierLights.forEach(b => {
        b.light.intensity = 1.6 + Math.sin(time + b.light.position.x) * 0.4;
      });
    }

    if (this.gameState === 'PLAYING') {
      // 1. Update Player
      this.player.update(delta);
      if (this.player.health <= 0) {
        this.triggerGameOver("CENTURION VALERIUS HAS FALLEN IN COMBAT!");
      }

      // 2. Update Enemies & Siege
      this.enemies.update(delta);

      // 3. Update Roman Allies
      this.allies.update(delta);

      // 4. Update Combat & Projectiles
      this.combat.update(delta);

      // 5. Update Interactive Prompts
      const ladder = this.enemies.getNearbyLadder(this.player.position, 3.8);
      const rackIdx = this.combat.getNearbyBoulderRack(this.player.position, 3.0);

      if (ladder) {
        this.ui.showInteractionPrompt("PUSH DOWN ASSAULT LADDER");
      } else if (rackIdx !== -1) {
        this.ui.showInteractionPrompt("DROP BOULDER ON ATTACKERS");
      } else {
        this.ui.hideInteractionPrompt();
      }

      // 6. Update UI & Radar
      this.ui.update(this.fortressData.wallHealth, this.fortressData.gateHealth);
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start Game instance on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
