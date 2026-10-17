import * as THREE from 'three';

// Procedural 3D Mesh Generator for Roman & Greek Warriors, Temple & Siege Props

// Materials Cache for high performance
export const materials = {
  // Roman Materials
  romanTunic: new THREE.MeshStandardMaterial({ color: 0x991818, roughness: 0.7 }),
  romanPlate: new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.3 }),
  romanGold: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.7, roughness: 0.35 }),
  romanLeather: new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.85 }),
  scutumRed: new THREE.MeshStandardMaterial({ color: 0x8a1010, roughness: 0.5, side: THREE.DoubleSide }),
  scutumGold: new THREE.MeshStandardMaterial({ color: 0xf1c40f, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide }),
  capeRed: new THREE.MeshStandardMaterial({ color: 0xb81c1c, roughness: 0.8, side: THREE.DoubleSide }),
  steelBlade: new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.95, roughness: 0.15 }),
  bronzeBoss: new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.85, roughness: 0.3 }),
  skinTone: new THREE.MeshStandardMaterial({ color: 0xd69d76, roughness: 0.7 }),

  // Greek Materials
  greekBronze: new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.8, roughness: 0.35 }),
  greekShieldBlue: new THREE.MeshStandardMaterial({ color: 0x1a3d6e, roughness: 0.6, side: THREE.DoubleSide }),
  greekTunicWhite: new THREE.MeshStandardMaterial({ color: 0xe6e6fa, roughness: 0.75 }),
  greekPlumeBlack: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }),
  greekSpartanRed: new THREE.MeshStandardMaterial({ color: 0x7a0c0c, roughness: 0.6, side: THREE.DoubleSide }),
  greekWood: new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.8 }),
  greekBossGold: new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.85, roughness: 0.2 }),

  // Environment & Architecture Materials
  marbleLight: new THREE.MeshStandardMaterial({ color: 0xded8cc, roughness: 0.65 }),
  stoneMasonry: new THREE.MeshStandardMaterial({ color: 0x736c64, roughness: 0.85 }),
  stoneDark: new THREE.MeshStandardMaterial({ color: 0x48423d, roughness: 0.9 }),
  templeRoofTile: new THREE.MeshStandardMaterial({ color: 0x9c3d23, roughness: 0.7 }),
  gateWood: new THREE.MeshStandardMaterial({ color: 0x3d2516, roughness: 0.8 }),
  ironBand: new THREE.MeshStandardMaterial({ color: 0x222225, metalness: 0.8, roughness: 0.4 }),
  fireBrazier: new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 0.8 }),
  groundGrass: new THREE.MeshStandardMaterial({ color: 0x47562f, roughness: 0.95 }),
  dirtRoad: new THREE.MeshStandardMaterial({ color: 0x6e5c46, roughness: 0.9 })
};

// --- HELPER: Create Scutum Shield (Curved Rectangular Roman Shield) ---
export function createScutumMesh() {
  const scutumGroup = new THREE.Group();

  // Curved shield body (Faces forward +Z, curves back towards the arm)
  const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.25, 16, 1, true, -Math.PI / 3.8, Math.PI / 1.9);
  const body = new THREE.Mesh(bodyGeo, materials.scutumRed);
  body.position.set(0, 0, -0.38); // Apex at z = +0.12, edges curve back to z = -0.04
  body.castShadow = true;
  scutumGroup.add(body);

  // Inner wooden horizontal grip handle for Centurion's hand (visible from behind!)
  const gripGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8);
  const grip = new THREE.Mesh(gripGeo, materials.romanLeather);
  grip.rotation.z = Math.PI / 2;
  grip.position.set(0, 0, 0.04);
  scutumGroup.add(grip);

  // Vertical Brass Rims on left & right curved edges
  const rimGeo = new THREE.BoxGeometry(0.04, 1.26, 0.04);
  const rimLeft = new THREE.Mesh(rimGeo, materials.romanGold);
  rimLeft.position.set(-0.36, 0, -0.04);
  const rimRight = new THREE.Mesh(rimGeo, materials.romanGold);
  rimRight.position.set(0.36, 0, -0.04);
  scutumGroup.add(rimLeft, rimRight);

  // Horizontal Brass Rims on top & bottom
  const hRimGeo = new THREE.BoxGeometry(0.74, 0.04, 0.04);
  const rimTop = new THREE.Mesh(hRimGeo, materials.romanGold);
  rimTop.position.set(0, 0.63, 0.04);
  const rimBottom = new THREE.Mesh(hRimGeo, materials.romanGold);
  rimBottom.position.set(0, -0.63, 0.04);
  scutumGroup.add(rimTop, rimBottom);

  // Central Umbo / Brass Boss (Spike/Dome) on shield front
  const bossGeo = new THREE.ConeGeometry(0.12, 0.14, 12);
  const boss = new THREE.Mesh(bossGeo, materials.bronzeBoss);
  boss.rotation.x = Math.PI / 2;
  boss.position.set(0, 0, 0.18);
  scutumGroup.add(boss);

  // Golden Eagle Wings / Thunderbolt Insignia on shield face
  const wingGeo = new THREE.BoxGeometry(0.35, 0.08, 0.02);
  const wingTop = new THREE.Mesh(wingGeo, materials.scutumGold);
  wingTop.position.set(0, 0.32, 0.13);
  const wingBottom = new THREE.Mesh(wingGeo, materials.scutumGold);
  wingBottom.position.set(0, -0.32, 0.13);
  scutumGroup.add(wingTop, wingBottom);

  return scutumGroup;
}

// --- HELPER: Create Roman Gladius (Leaf-shaped short sword) ---
export function createGladiusMesh() {
  const gladiusGroup = new THREE.Group();

  // Blade
  const bladeGeo = new THREE.ConeGeometry(0.09, 0.85, 4);
  bladeGeo.scale(0.35, 1, 1);
  const blade = new THREE.Mesh(bladeGeo, materials.steelBlade);
  blade.position.y = 0.5;
  blade.castShadow = true;
  gladiusGroup.add(blade);

  // Crossguard
  const guardGeo = new THREE.BoxGeometry(0.2, 0.05, 0.08);
  const guard = new THREE.Mesh(guardGeo, materials.romanGold);
  guard.position.y = 0.06;
  gladiusGroup.add(guard);

  // Bone Hilt / Grip
  const gripGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
  const grip = new THREE.Mesh(gripGeo, materials.skinTone);
  grip.position.y = -0.06;
  gladiusGroup.add(grip);

  // Spherical Pommel
  const pommelGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const pommel = new THREE.Mesh(pommelGeo, materials.romanGold);
  pommel.position.y = -0.18;
  gladiusGroup.add(pommel);

  return gladiusGroup;
}

// --- HELPER: Create Roman Pilum (Heavy javelin) ---
export function createPilumMesh() {
  const pilum = new THREE.Group();

  // Wooden shaft
  const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8);
  const shaft = new THREE.Mesh(shaftGeo, materials.greekWood);
  shaft.position.y = 0.8;
  pilum.add(shaft);

  // Iron shank & pyramid point
  const ironGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.6, 8);
  const iron = new THREE.Mesh(ironGeo, materials.steelBlade);
  iron.position.y = 1.9;
  pilum.add(iron);

  const tipGeo = new THREE.ConeGeometry(0.04, 0.15, 4);
  const tip = new THREE.Mesh(tipGeo, materials.romanGold);
  tip.position.y = 2.25;
  pilum.add(tip);

  return pilum;
}

// --- HELPER: Create Greek Dory Spear (Heavy Hoplite Thrusting Spear) ---
export function createGreekSpearMesh() {
  const spearGroup = new THREE.Group();

  // 1. Long wooden ash shaft (2.4m long)
  // Shifted along Y so the warrior's hand grips it around 1/3 from the rear (grip balance point)
  const gripOffset = 0.35;
  const shaftGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.4, 8);
  const shaft = new THREE.Mesh(shaftGeo, materials.greekWood);
  shaft.position.y = gripOffset;
  shaft.castShadow = true;
  spearGroup.add(shaft);

  // 2. Bronze socket collar connecting shaft to blade
  const collarGeo = new THREE.CylinderGeometry(0.032, 0.026, 0.08, 8);
  const collar = new THREE.Mesh(collarGeo, materials.greekBronze);
  collar.position.y = gripOffset + 1.2 + 0.04; // Sits flush on top of the 2.4m shaft
  spearGroup.add(collar);

  // 3. Steel leaf-shaped spearhead blade (spear tip)
  const tipGeo = new THREE.ConeGeometry(0.065, 0.35, 4);
  tipGeo.scale(0.35, 1, 1); // Flatten for classic leaf blade profile
  const tip = new THREE.Mesh(tipGeo, materials.steelBlade);
  tip.position.y = gripOffset + 1.2 + 0.08 + 0.175; // Sits directly on collar, apex points forward
  tip.castShadow = true;
  spearGroup.add(tip);

  // 4. Bronze Sauroter ("Lizard-Killer") butt-spike at back end
  const sauroterGeo = new THREE.ConeGeometry(0.038, 0.18, 4);
  const sauroter = new THREE.Mesh(sauroterGeo, materials.greekBronze);
  sauroter.rotation.z = Math.PI; // Point spike backwards
  sauroter.position.y = gripOffset - 1.2 - 0.09; // Sits flush at bottom of shaft
  spearGroup.add(sauroter);

  return spearGroup;
}

// ==========================================
// 1. ROMAN CENTURION (PLAYER CHARACTER)
// ==========================================
export function createRomanCenturion() {
  const root = new THREE.Group();

  // Torso / Lorica Segmentata
  const torsoGroup = new THREE.Group();
  const chestGeo = new THREE.BoxGeometry(0.55, 0.65, 0.32);
  const chest = new THREE.Mesh(chestGeo, materials.romanPlate);
  chest.position.y = 1.15;
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Golden Medallion on chest
  const medGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12);
  const med = new THREE.Mesh(medGeo, materials.romanGold);
  med.rotation.x = Math.PI / 2;
  med.position.set(0, 1.25, 0.17);
  torsoGroup.add(med);

  // Crimson Tunic hem & Pteruges (leather fringe strips)
  const pterugesGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.28, 8);
  const pteruges = new THREE.Mesh(pterugesGeo, materials.romanLeather);
  pteruges.position.y = 0.75;
  torsoGroup.add(pteruges);

  const tunicHemGeo = new THREE.CylinderGeometry(0.32, 0.37, 0.1, 8);
  const tunicHem = new THREE.Mesh(tunicHemGeo, materials.romanTunic);
  tunicHem.position.y = 0.62;
  torsoGroup.add(tunicHem);

  // Head & Galea Helmet with Centurion's Transverse Crest
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.55, 0);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), materials.skinTone);
  headGroup.add(headMesh);

  // Helmet Bowl
  const helmGeo = new THREE.SphereGeometry(0.18, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const helm = new THREE.Mesh(helmGeo, materials.romanPlate);
  helm.position.y = 0.02;
  headGroup.add(helm);

  // Cheek guards
  const cheekGeo = new THREE.BoxGeometry(0.04, 0.12, 0.08);
  const cheekL = new THREE.Mesh(cheekGeo, materials.romanGold);
  cheekL.position.set(0.16, -0.06, 0.04);
  const cheekR = new THREE.Mesh(cheekGeo, materials.romanGold);
  cheekR.position.set(-0.16, -0.06, 0.04);
  headGroup.add(cheekL, cheekR);

  // Transverse Red Crest (Centurion symbol - runs ear to ear!)
  const crestGeo = new THREE.BoxGeometry(0.48, 0.18, 0.08);
  const crest = new THREE.Mesh(crestGeo, materials.capeRed);
  crest.position.set(0, 0.26, 0);
  headGroup.add(crest);

  torsoGroup.add(headGroup);

  // Billowing Red Cloak / Cape (Pivoted at upper shoulders, strictly behind back)
  const capeGeo = new THREE.PlaneGeometry(0.62, 1.1, 4, 8);
  capeGeo.translate(0, -0.55, 0); // Translate so (0,0,0) is top edge: cape hangs DOWN from shoulders
  const cape = new THREE.Mesh(capeGeo, materials.capeRed);
  cape.position.set(0, 1.36, -0.18); // Fastened at shoulder level below helmet rim
  cape.rotation.x = 0.12;
  cape.castShadow = true;
  torsoGroup.add(cape);

  // Golden Fibula Brooches / Shoulder Clasps securing the cape
  const fibulaGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8);
  const fibulaL = new THREE.Mesh(fibulaGeo, materials.romanGold);
  fibulaL.rotation.x = Math.PI / 2;
  fibulaL.position.set(-0.22, 1.36, -0.17);
  const fibulaR = new THREE.Mesh(fibulaGeo, materials.romanGold);
  fibulaR.rotation.x = Math.PI / 2;
  fibulaR.position.set(0.22, 1.36, -0.17);
  torsoGroup.add(fibulaL, fibulaR);

  // Left Arm + Scutum Shield
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(0.35, 1.35, 0);
  const armLGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8);
  const armL = new THREE.Mesh(armLGeo, materials.romanPlate);
  armL.position.y = -0.25;
  armL.castShadow = true;
  leftArmGroup.add(armL);

  const scutum = createScutumMesh();
  scutum.position.set(0.12, -0.25, 0.22);
  leftArmGroup.add(scutum);
  torsoGroup.add(leftArmGroup);

  // Right Arm + Gladius
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(-0.35, 1.35, 0);
  const armRGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.55, 8);
  const armR = new THREE.Mesh(armRGeo, materials.romanPlate);
  armR.position.y = -0.25;
  armR.castShadow = true;
  rightArmGroup.add(armR);

  const gladius = createGladiusMesh();
  gladius.position.set(0, -0.5, 0.2);
  gladius.rotation.x = Math.PI / 4;
  rightArmGroup.add(gladius);
  torsoGroup.add(rightArmGroup);

  // Legs & Caligae
  const legLGroup = new THREE.Group();
  legLGroup.position.set(0.16, 0.65, 0);
  const legLGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.65, 8);
  const legL = new THREE.Mesh(legLGeo, materials.romanGold); // Greave
  legL.position.y = -0.32;
  legL.castShadow = true;
  legLGroup.add(legL);

  const legRGroup = new THREE.Group();
  legRGroup.position.set(-0.16, 0.65, 0);
  const legR = new THREE.Mesh(legLGeo, materials.romanGold);
  legR.position.y = -0.32;
  legR.castShadow = true;
  legRGroup.add(legR);

  root.add(torsoGroup);
  root.add(legLGroup);
  root.add(legRGroup);

  // Sheathed Pila on Back
  const backPilum1 = createPilumMesh();
  backPilum1.scale.set(0.6, 0.6, 0.6);
  backPilum1.rotation.z = 0.45;
  backPilum1.position.set(-0.15, 0.5, -0.25);
  torsoGroup.add(backPilum1);

  return {
    root,
    torsoGroup,
    headGroup,
    leftArmGroup,
    rightArmGroup,
    legLGroup,
    legRGroup,
    gladius,
    scutum,
    cape
  };
}

// ==========================================
// 2. ROMAN ALLIED LEGIONARY
// ==========================================
export function createRomanLegionary(isArcher = false) {
  const root = new THREE.Group();

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.3), materials.romanPlate);
  chest.position.y = 1.1;
  chest.castShadow = true;
  root.add(chest);

  const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.25, 8), materials.romanTunic);
  tunic.position.y = 0.7;
  root.add(tunic);

  // Helmet with front-to-back red plume
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), materials.skinTone);
  head.position.y = 1.5;
  root.add(head);

  const helm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), materials.romanPlate);
  helm.position.y = 1.52;
  root.add(helm);

  const plume = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.38), materials.romanTunic);
  plume.position.set(0, 1.74, 0);
  root.add(plume);

  // Arms & Legs
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8), materials.romanLeather);
  legL.position.set(0.15, 0.3, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8), materials.romanLeather);
  legR.position.set(-0.15, 0.3, 0);
  legR.castShadow = true;
  root.add(legL, legR);

  const armL = new THREE.Group();
  armL.position.set(0.32, 1.25, 0);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(-0.32, 1.25, 0);
  root.add(armR);

  if (isArcher) {
    // Bow
    const bowCurve = new THREE.TorusGeometry(0.4, 0.02, 6, 12, Math.PI * 0.85);
    const bow = new THREE.Mesh(bowCurve, materials.greekWood);
    bow.position.set(0.2, 0, 0.25);
    bow.rotation.y = Math.PI / 2;
    armL.add(bow);
  } else {
    // Scutum & Gladius
    const scutum = createScutumMesh();
    scutum.scale.set(0.85, 0.85, 0.85);
    scutum.position.set(0.1, -0.2, 0.2);
    armL.add(scutum);

    const gladius = createGladiusMesh();
    gladius.scale.set(0.85, 0.85, 0.85);
    gladius.position.set(0, -0.3, 0.2);
    gladius.rotation.x = Math.PI / 4;
    armR.add(gladius);
  }

  return { root, armL, armR, legL, legR };
}

// ==========================================
// 3. GREEK HOPLITE (ENEMY MELEE)
// ==========================================
export function createGreekHoplite(isBoss = false) {
  const root = new THREE.Group();
  const scale = isBoss ? 1.35 : 1.0;
  root.scale.set(scale, scale, scale);

  const armorMat = isBoss ? materials.greekBossGold : materials.greekBronze;
  const shieldMat = isBoss ? materials.greekSpartanRed : materials.greekShieldBlue;

  // Muscle Cuirass Torso
  const torsoGroup = new THREE.Group();
  const chestGeo = new THREE.BoxGeometry(0.52, 0.62, 0.3);
  const chest = new THREE.Mesh(chestGeo, armorMat);
  chest.position.y = 1.1;
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Greek Chiton / Tunic peeking out
  const chitonGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.25, 8);
  const chiton = new THREE.Mesh(chitonGeo, isBoss ? materials.greekSpartanRed : materials.greekTunicWhite);
  chiton.position.y = 0.72;
  torsoGroup.add(chiton);

  // Corinthian Helmet with tall horsehair crest
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.5, 0);

  const helmGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const helm = new THREE.Mesh(helmGeo, armorMat);
  headGroup.add(helm);

  // Nose guard & eye slits
  const noseGeo = new THREE.BoxGeometry(0.04, 0.16, 0.12);
  const nose = new THREE.Mesh(noseGeo, armorMat);
  nose.position.set(0, -0.05, 0.15);
  headGroup.add(nose);

  // Tall Black/White Crest
  const crestGeo = new THREE.BoxGeometry(0.08, 0.28, 0.5);
  const crest = new THREE.Mesh(crestGeo, materials.greekPlumeBlack);
  crest.position.set(0, 0.25, -0.05);
  headGroup.add(crest);

  torsoGroup.add(headGroup);

  // Left Arm + Aspis / Hoplon (Circular concave shield)
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(0.32, 1.25, 0);

  const armLGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.55, 8);
  const armL = new THREE.Mesh(armLGeo, materials.skinTone);
  armL.position.y = -0.25;
  armL.castShadow = true;
  leftArmGroup.add(armL);

  // Aspis shield
  const aspisGeo = new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.3);
  const aspis = new THREE.Mesh(aspisGeo, shieldMat);
  aspis.rotation.x = Math.PI / 2;
  aspis.position.set(0.15, -0.15, 0.22);
  aspis.castShadow = true;

  // Bronze Rim
  const rimGeo = new THREE.TorusGeometry(0.53, 0.03, 8, 20);
  const rim = new THREE.Mesh(rimGeo, armorMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0.15, -0.15, 0.22);
  leftArmGroup.add(rim);

  // Lambda (Λ) Spartan emblem
  const lambdaGeo = new THREE.BoxGeometry(0.3, 0.06, 0.02);
  const lambdaL = new THREE.Mesh(lambdaGeo, materials.romanGold);
  lambdaL.rotation.z = Math.PI / 3;
  lambdaL.position.set(0.1, -0.15, 0.42);
  const lambdaR = new THREE.Mesh(lambdaGeo, materials.romanGold);
  lambdaR.rotation.z = -Math.PI / 3;
  lambdaR.position.set(0.2, -0.15, 0.42);
  leftArmGroup.add(lambdaL, lambdaR);

  leftArmGroup.add(aspis);
  torsoGroup.add(leftArmGroup);

  // Right Arm + Dory Spear
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(-0.32, 1.25, 0);

  // Greek Warrior's Right Arm (holding the spear)
  const armRGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.55, 8);
  const armR = new THREE.Mesh(armRGeo, materials.skinTone);
  armR.position.y = -0.25;
  armR.castShadow = true;
  rightArmGroup.add(armR);

  // Bronze Vambrace (Forearm Armor)
  const vambraceGeo = new THREE.CylinderGeometry(0.078, 0.068, 0.22, 8);
  const vambrace = new THREE.Mesh(vambraceGeo, armorMat);
  vambrace.position.y = -0.32;
  rightArmGroup.add(vambrace);

  // Greek Dory Spear (Spear tip is locked onto the end of the shaft!)
  const spearGroup = createGreekSpearMesh();
  spearGroup.position.set(0, -0.48, 0.12);
  spearGroup.rotation.x = Math.PI / 2.3;
  rightArmGroup.add(spearGroup);
  torsoGroup.add(rightArmGroup);

  // Legs & Bronze Greaves
  const legLGroup = new THREE.Group();
  legLGroup.position.set(0.15, 0.6, 0);
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.6, 8), armorMat);
  legL.position.y = -0.3;
  legL.castShadow = true;
  legLGroup.add(legL);

  const legRGroup = new THREE.Group();
  legRGroup.position.set(-0.15, 0.6, 0);
  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.6, 8), armorMat);
  legR.position.y = -0.3;
  legR.castShadow = true;
  legRGroup.add(legR);

  root.add(torsoGroup, legLGroup, legRGroup);

  return {
    root,
    torsoGroup,
    headGroup,
    leftArmGroup,
    rightArmGroup,
    legLGroup,
    legRGroup,
    spearGroup
  };
}

// ==========================================
// 4. GREEK PELTAST (SKIRMISHER)
// ==========================================
export function createGreekPeltast() {
  const root = new THREE.Group();

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.28), materials.romanLeather);
  chest.position.y = 1.05;
  chest.castShadow = true;
  root.add(chest);

  const tunic = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.25, 8), materials.greekTunicWhite);
  tunic.position.y = 0.68;
  root.add(tunic);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), materials.skinTone);
  head.position.y = 1.45;
  root.add(head);

  // Phrygian leather cap
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.22, 8), materials.romanLeather);
  cap.position.set(0, 1.62, -0.04);
  cap.rotation.x = -0.3;
  root.add(cap);

  // Left Arm with Crescent Pelta Shield
  const armL = new THREE.Group();
  armL.position.set(0.3, 1.2, 0);
  const peltaGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.04, 12, 1, false, 0, Math.PI * 1.5);
  const pelta = new THREE.Mesh(peltaGeo, materials.greekWood);
  pelta.rotation.x = Math.PI / 2;
  pelta.position.set(0.1, -0.1, 0.15);
  pelta.castShadow = true;
  armL.add(pelta);
  root.add(armL);

  // Right Arm holding javelin
  const armR = new THREE.Group();
  armR.position.set(-0.3, 1.2, 0);
  const javelin = createPilumMesh();
  javelin.scale.set(0.7, 0.7, 0.7);
  javelin.rotation.x = Math.PI / 3;
  armR.add(javelin);
  root.add(armR);

  // Legs
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.6, 8), materials.skinTone);
  legL.position.set(0.14, 0.3, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.6, 8), materials.skinTone);
  legR.position.set(-0.14, 0.3, 0);
  legR.castShadow = true;
  root.add(legL, legR);

  return { root, armL, armR, legL, legR };
}

// ==========================================
// 5. GREEK TOXOTAI (ARCHER)
// ==========================================
export function createGreekArcher() {
  const root = new THREE.Group();

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.58, 0.28), materials.greekTunicWhite);
  chest.position.y = 1.05;
  chest.castShadow = true;
  root.add(chest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), materials.skinTone);
  head.position.y = 1.45;
  root.add(head);

  // Bow
  const armL = new THREE.Group();
  armL.position.set(0.3, 1.2, 0);
  const bowCurve = new THREE.TorusGeometry(0.45, 0.02, 6, 12, Math.PI * 0.85);
  const bow = new THREE.Mesh(bowCurve, materials.greekWood);
  bow.position.set(0.1, 0, 0.2);
  bow.rotation.y = Math.PI / 2;
  armL.add(bow);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(-0.3, 1.2, 0);
  root.add(armR);

  // Legs
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.6, 8), materials.skinTone);
  legL.position.set(0.14, 0.3, 0);
  legL.castShadow = true;
  const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.6, 8), materials.skinTone);
  legR.position.set(-0.14, 0.3, 0);
  legR.castShadow = true;
  root.add(legL, legR);

  // Quiver on back
  const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.55, 8), materials.romanLeather);
  quiver.position.set(-0.15, 1.15, -0.18);
  quiver.rotation.z = 0.4;
  root.add(quiver);

  return { root, armL, armR, legL, legR };
}

// ==========================================
// 6. SIEGE LADDER
// ==========================================
export function createAssaultLadder() {
  const ladderGroup = new THREE.Group();
  const height = 9.2;
  const width = 1.2;

  // Side beams
  const beamGeo = new THREE.BoxGeometry(0.12, height, 0.12);
  const beamL = new THREE.Mesh(beamGeo, materials.greekWood);
  beamL.position.x = -width / 2;
  beamL.position.y = height / 2;
  beamL.castShadow = true;

  const beamR = new THREE.Mesh(beamGeo, materials.greekWood);
  beamR.position.x = width / 2;
  beamR.position.y = height / 2;
  beamR.castShadow = true;

  ladderGroup.add(beamL, beamR);

  // Rungs
  const rungCount = 18;
  const rungGeo = new THREE.CylinderGeometry(0.04, 0.04, width, 8);
  for (let i = 1; i <= rungCount; i++) {
    const rung = new THREE.Mesh(rungGeo, materials.greekWood);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, (height / (rungCount + 1)) * i, 0);
    rung.castShadow = true;
    ladderGroup.add(rung);
  }

  return ladderGroup;
}

// ==========================================
// 7. BATTERING RAM
// ==========================================
export function createBatteringRamMesh() {
  const ramGroup = new THREE.Group();

  // Wheeled chassis roof
  const roofGeo = new THREE.BoxGeometry(3.5, 2.5, 5.0);
  const roof = new THREE.Mesh(roofGeo, materials.greekWood);
  roof.position.y = 2.0;
  roof.castShadow = true;
  ramGroup.add(roof);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 12);
  const wheelPositions = [
    [-1.8, 0.6, 1.8],
    [1.8, 0.6, 1.8],
    [-1.8, 0.6, -1.8],
    [1.8, 0.6, -1.8]
  ];
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeo, materials.stoneDark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(...pos);
    wheel.castShadow = true;
    ramGroup.add(wheel);
  });

  // Hanging Iron Ram Head & Log
  const logGeo = new THREE.CylinderGeometry(0.35, 0.35, 6.0, 10);
  const log = new THREE.Mesh(logGeo, materials.greekWood);
  log.rotation.x = Math.PI / 2;
  log.position.set(0, 1.6, 0.5);
  log.castShadow = true;

  const ramHeadGeo = new THREE.ConeGeometry(0.5, 0.8, 8);
  const ramHead = new THREE.Mesh(ramHeadGeo, materials.ironBand);
  ramHead.rotation.x = -Math.PI / 2;
  ramHead.position.set(0, 1.6, 3.8);
  ramHead.castShadow = true;

  ramGroup.add(log, ramHead);

  return ramGroup;
}

// ==========================================
// 8. TEMPLE & DEFENSIVE WALL FORTRESS
// ==========================================
export function createTempleAndFortress() {
  const fortressGroup = new THREE.Group();

  // WALL SPECIFICATIONS:
  // Wall length: 80 units wide, 7.5 units tall, 4 units deep.
  // Parapet walkway top is at Y = 7.0.
  // Merlon / Crenellations top at Y = 8.4.

  const wallWidth = 84;
  const wallHeight = 7.2;
  const wallDepth = 4.2;

  // Left & Right Wall segments with center gap for Gate
  const segWidth = 36;
  const wallLGeo = new THREE.BoxGeometry(segWidth, wallHeight, wallDepth);
  const wallL = new THREE.Mesh(wallLGeo, materials.stoneMasonry);
  wallL.position.set(-24, wallHeight / 2, 0);
  wallL.castShadow = true;
  wallL.receiveShadow = true;

  const wallR = new THREE.Mesh(wallLGeo, materials.stoneMasonry);
  wallR.position.set(24, wallHeight / 2, 0);
  wallR.castShadow = true;
  wallR.receiveShadow = true;

  fortressGroup.add(wallL, wallR);

  // Parapet Crenellations (Battlements with arrow slits)
  const merlonCount = 20;
  for (let i = 0; i < merlonCount; i++) {
    const x = -40 + (80 / merlonCount) * i;
    // Skip central gate area (-6 to 6)
    if (Math.abs(x) < 6) continue;

    const merlonGeo = new THREE.BoxGeometry(2.0, 1.4, 0.6);
    const merlon = new THREE.Mesh(merlonGeo, materials.stoneMasonry);
    merlon.position.set(x, wallHeight + 0.7, wallDepth / 2 - 0.3);
    merlon.castShadow = true;
    fortressGroup.add(merlon);
  }

  // Rear Safety Railing on Parapet
  const railL = new THREE.Mesh(new THREE.BoxGeometry(segWidth, 1.0, 0.4), materials.stoneDark);
  railL.position.set(-24, wallHeight + 0.5, -wallDepth / 2 + 0.2);
  const railR = new THREE.Mesh(new THREE.BoxGeometry(segWidth, 1.0, 0.4), materials.stoneDark);
  railR.position.set(24, wallHeight + 0.5, -wallDepth / 2 + 0.2);
  fortressGroup.add(railL, railR);

  // Central Gatehouse Walkway Bridge (spans gap above gate doors, connects Wall L and Wall R)
  const gateBridgeGeo = new THREE.BoxGeometry(12, 0.6, wallDepth);
  const gateBridge = new THREE.Mesh(gateBridgeGeo, materials.stoneMasonry);
  gateBridge.position.set(0, wallHeight - 0.3, 0); // Walkway top flush at y = 7.2
  gateBridge.castShadow = true;
  gateBridge.receiveShadow = true;
  fortressGroup.add(gateBridge);

  // Gatehouse Front Parapet Crenellations (with central arrow slit for player defense)
  const gateMerlonGeo = new THREE.BoxGeometry(2.4, 1.4, 0.6);
  const gateMerlonL = new THREE.Mesh(gateMerlonGeo, materials.stoneMasonry);
  gateMerlonL.position.set(-2.5, wallHeight + 0.7, wallDepth / 2 - 0.3);
  gateMerlonL.castShadow = true;
  const gateMerlonR = new THREE.Mesh(gateMerlonGeo, materials.stoneMasonry);
  gateMerlonR.position.set(2.5, wallHeight + 0.7, wallDepth / 2 - 0.3);
  gateMerlonR.castShadow = true;
  fortressGroup.add(gateMerlonL, gateMerlonR);

  // Gatehouse Rear Safety Railing
  const gateRail = new THREE.Mesh(new THREE.BoxGeometry(12, 1.0, 0.4), materials.stoneDark);
  gateRail.position.set(0, wallHeight + 0.5, -wallDepth / 2 + 0.2);
  fortressGroup.add(gateRail);

  // Helper to build a Bastion Gate Tower with an Arched Walkway Corridor
  function createGateBastionTower(towerX) {
    const towerGroup = new THREE.Group();

    // 1. Solid Stone Base (Ground to Wall Walkway level, y: 0 -> 7.2)
    const baseGeo = new THREE.BoxGeometry(8, wallHeight, 8);
    const baseMesh = new THREE.Mesh(baseGeo, materials.stoneMasonry);
    baseMesh.position.set(towerX, wallHeight / 2, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    towerGroup.add(baseMesh);

    // 2. Front Bastion Wall (overlooking battlefield, z: 1.8 -> 4.0)
    const frontWallGeo = new THREE.BoxGeometry(8, 3.0, 2.2);
    const frontWall = new THREE.Mesh(frontWallGeo, materials.stoneMasonry);
    frontWall.position.set(towerX, wallHeight + 1.5, 2.9);
    frontWall.castShadow = true;
    frontWall.receiveShadow = true;
    towerGroup.add(frontWall);

    // Front arrow slit embrasures (dark recessed cutouts)
    const slitGeo = new THREE.BoxGeometry(0.8, 1.5, 0.3);
    const slitMesh = new THREE.Mesh(slitGeo, materials.stoneDark);
    slitMesh.position.set(towerX, wallHeight + 1.5, 4.02);
    towerGroup.add(slitMesh);

    // 3. Rear Bastion Wall (overlooking temple courtyard, z: -4.0 -> -1.8)
    const rearWallGeo = new THREE.BoxGeometry(8, 3.0, 2.2);
    const rearWall = new THREE.Mesh(rearWallGeo, materials.stoneMasonry);
    rearWall.position.set(towerX, wallHeight + 1.5, -2.9);
    rearWall.castShadow = true;
    rearWall.receiveShadow = true;
    towerGroup.add(rearWall);

    // 4. Arched Gateway Lintels over entrance and exit along X (y: 9.8)
    const lintelGeo = new THREE.BoxGeometry(0.8, 0.6, 3.6);
    const lintelIn = new THREE.Mesh(lintelGeo, materials.stoneDark);
    lintelIn.position.set(towerX - 3.6, wallHeight + 2.7, 0);
    const lintelOut = new THREE.Mesh(lintelGeo, materials.stoneDark);
    lintelOut.position.set(towerX + 3.6, wallHeight + 2.7, 0);
    towerGroup.add(lintelIn, lintelOut);

    // 5. Tower Roof Platform (y = 10.2, where archers stand and brazier burns)
    const roofGeo = new THREE.BoxGeometry(8.2, 0.3, 8.2);
    const roof = new THREE.Mesh(roofGeo, materials.stoneDark);
    roof.position.set(towerX, wallHeight + 2.85, 0); // Top surface at y = 10.2
    roof.castShadow = true;
    roof.receiveShadow = true;
    towerGroup.add(roof);

    // Tower Roof Battlements / Parapets around top platform
    [
      [towerX - 3.7, wallHeight + 3.4, 0, 0.8, 0.8, 8.0],
      [towerX + 3.7, wallHeight + 3.4, 0, 0.8, 0.8, 8.0],
      [towerX, wallHeight + 3.4, 3.7, 8.0, 0.8, 0.8],
      [towerX, wallHeight + 3.4, -3.7, 8.0, 0.8, 0.8]
    ].forEach(([bx, by, bz, bw, bh, bd]) => {
      const bGeo = new THREE.BoxGeometry(bw, bh, bd);
      const bMesh = new THREE.Mesh(bGeo, materials.stoneMasonry);
      bMesh.position.set(bx, by, bz);
      bMesh.castShadow = true;
      towerGroup.add(bMesh);
    });

    return towerGroup;
  }

  // Bastion Towers flanking gate with arched passageways
  const towerGateL = createGateBastionTower(-8);
  const towerGateR = createGateBastionTower(8);

  // End Bastion Towers (Flanking outer edges of wall at x = -42 and x = 42)
  const towerEndGeo = new THREE.BoxGeometry(8, wallHeight + 3.0, 8);
  const towerEndL = new THREE.Mesh(towerEndGeo, materials.stoneMasonry);
  towerEndL.position.set(-42, (wallHeight + 3.0) / 2, 0);
  towerEndL.castShadow = true;

  const towerEndR = new THREE.Mesh(towerEndGeo, materials.stoneMasonry);
  towerEndR.position.set(42, (wallHeight + 3.0) / 2, 0);
  towerEndR.castShadow = true;

  fortressGroup.add(towerGateL, towerGateR, towerEndL, towerEndR);

  // Central Oak Gate (Destructible)
  const gateGroup = new THREE.Group();
  gateGroup.position.set(0, 0, 0);

  const doorGeo = new THREE.BoxGeometry(4.8, 6.2, 0.6);
  const doorL = new THREE.Mesh(doorGeo, materials.gateWood);
  doorL.position.set(-2.4, 3.1, 0);
  doorL.castShadow = true;

  const doorR = new THREE.Mesh(doorGeo, materials.gateWood);
  doorR.position.set(2.4, 3.1, 0);
  doorR.castShadow = true;

  // Iron bands across door
  const bandGeo = new THREE.BoxGeometry(5.0, 0.2, 0.68);
  [-1.5, 0, 1.5].forEach(yOffset => {
    const bandL = new THREE.Mesh(bandGeo, materials.ironBand);
    bandL.position.set(-2.4, 3.1 + yOffset, 0);
    const bandR = new THREE.Mesh(bandGeo, materials.ironBand);
    bandR.position.set(2.4, 3.1 + yOffset, 0);
    gateGroup.add(bandL, bandR);
  });

  gateGroup.add(doorL, doorR);
  fortressGroup.add(gateGroup);

  // Stone Staircases from courtyard to wall walkway
  // Left stair
  const stairSteps = 14;
  for (let s = 0; s < stairSteps; s++) {
    const stepH = (wallHeight / stairSteps) * (s + 1);
    const stepZ = -wallDepth / 2 - (stairSteps - s) * 0.9;
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 0.9), materials.stoneDark);
    step.position.set(-14, (wallHeight / stairSteps) * (s + 0.5), stepZ);
    step.receiveShadow = true;
    fortressGroup.add(step);
  }
  // Right stair
  for (let s = 0; s < stairSteps; s++) {
    const stepZ = -wallDepth / 2 - (stairSteps - s) * 0.9;
    const step = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 0.9), materials.stoneDark);
    step.position.set(14, (wallHeight / stairSteps) * (s + 0.5), stepZ);
    step.receiveShadow = true;
    fortressGroup.add(step);
  }

  // --- THE CLASSICAL ROMAN TEMPLE (Behind the Wall) ---
  const templeGroup = new THREE.Group();
  templeGroup.position.set(0, 0, -32);

  // Podium base
  const podiumGeo = new THREE.BoxGeometry(26, 2.5, 34);
  const podium = new THREE.Mesh(podiumGeo, materials.marbleLight);
  podium.position.y = 1.25;
  podium.receiveShadow = true;
  templeGroup.add(podium);

  // Front Steps
  for (let st = 0; st < 6; st++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 0.8), materials.marbleLight);
    step.position.set(0, st * 0.4 + 0.2, 17 + (6 - st) * 0.8);
    step.receiveShadow = true;
    templeGroup.add(step);
  }

  // Fluted Marble Columns (6 along front, 6 along back, 4 along sides)
  const colGeo = new THREE.CylinderGeometry(0.65, 0.7, 9.5, 14);
  const colPositions = [
    [-10, 7.25, 14], [-6, 7.25, 14], [-2, 7.25, 14], [2, 7.25, 14], [6, 7.25, 14], [10, 7.25, 14], // Front
    [-10, 7.25, -14], [-6, 7.25, -14], [-2, 7.25, -14], [2, 7.25, -14], [6, 7.25, -14], [10, 7.25, -14], // Back
    [-10, 7.25, 6], [-10, 7.25, -4], [10, 7.25, 6], [10, 7.25, -4] // Sides
  ];
  colPositions.forEach(pos => {
    const col = new THREE.Mesh(colGeo, materials.marbleLight);
    col.position.set(...pos);
    col.castShadow = true;
    col.receiveShadow = true;
    templeGroup.add(col);
  });

  // Temple Cella (Interior sanctuary room)
  const cellaGeo = new THREE.BoxGeometry(18, 9.5, 22);
  const cella = new THREE.Mesh(cellaGeo, materials.stoneDark);
  cella.position.set(0, 7.25, -2);
  cella.castShadow = true;
  templeGroup.add(cella);

  // Pediment / Roof
  const entablatureGeo = new THREE.BoxGeometry(27, 1.2, 35);
  const entablature = new THREE.Mesh(entablatureGeo, materials.marbleLight);
  entablature.position.set(0, 12.6, 0);
  templeGroup.add(entablature);

  // Triangular Pediment Front
  const pedimentGeo = new THREE.CylinderGeometry(14, 14, 0.8, 3);
  const pediment = new THREE.Mesh(pedimentGeo, materials.marbleLight);
  pediment.rotation.z = Math.PI;
  pediment.rotation.x = Math.PI / 2;
  pediment.position.set(0, 15.2, 17.2);
  templeGroup.add(pediment);

  // Terracotta Tile Roof
  const roofGeo = new THREE.ConeGeometry(20, 4.5, 4);
  roofGeo.scale(0.75, 1, 1);
  const roof = new THREE.Mesh(roofGeo, materials.templeRoofTile);
  roof.rotation.y = Math.PI / 4;
  roof.position.set(0, 15.5, 0);
  templeGroup.add(roof);

  // Golden Eagle of Mars on front pediment
  const eagleGeo = new THREE.SphereGeometry(1.0, 8, 8);
  const eagle = new THREE.Mesh(eagleGeo, materials.romanGold);
  eagle.position.set(0, 15.2, 17.8);
  templeGroup.add(eagle);

  fortressGroup.add(templeGroup);

  // Braziers with burning fire on towers
  const brazierPositions = [
    [-8, wallHeight + 3.2, 0],
    [8, wallHeight + 3.2, 0],
    [-42, wallHeight + 3.2, 0],
    [42, wallHeight + 3.2, 0]
  ];

  const brazierLights = [];
  brazierPositions.forEach(pos => {
    const bowlGeo = new THREE.CylinderGeometry(0.8, 0.4, 0.8, 10);
    const bowl = new THREE.Mesh(bowlGeo, materials.ironBand);
    bowl.position.set(...pos);

    const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 8), materials.fireBrazier);
    flameMesh.position.set(pos[0], pos[1] + 0.6, pos[2]);

    const fireLight = new THREE.PointLight(0xff7722, 1.8, 25);
    fireLight.position.set(pos[0], pos[1] + 1.2, pos[2]);

    fortressGroup.add(bowl, flameMesh, fireLight);
    brazierLights.push({ light: fireLight, mesh: flameMesh });
  });

  return {
    fortressGroup,
    gateGroup,
    doorL,
    doorR,
    brazierLights,
    wallHeight,
    wallWidth,
    wallDepth
  };
}

// ==========================================
// 9. DEFENSE PROPS: BOULDERS & WEAPON RACKS
// ==========================================
export function createRampartBoulder() {
  const geo = new THREE.DodecahedronGeometry(0.55, 1);
  const mesh = new THREE.Mesh(geo, materials.stoneDark);
  mesh.castShadow = true;
  return mesh;
}
