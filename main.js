import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a3138);
scene.fog = new THREE.Fog(0x2a3138, 20, 90);

const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.4;
const WALK_SPEED = 5;

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    500
);
camera.position.set(0, PLAYER_HEIGHT, 75);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xaabbcc, 0x333a40, 1.8));
const moon = new THREE.DirectionalLight(0xdde6ff, 2.2);
moon.position.set(20, 40, 10);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.left = -45;
moon.shadow.camera.right = 45;
moon.shadow.camera.top = 90;
moon.shadow.camera.bottom = -90;
scene.add(moon);


const ARENA_W = 60;
const ARENA_L = 160;
const WALL_H = 4;
const WALL_T = 1.5;

const START_POS = { x: 0, z: 75 };
const EXTRACTION = { x: 0, z: -68, size: 14 };

const colliders = [];
const wallMeshes = [];

function addWall(cx, cz, w, d, color = 0x6b6f72, h = WALL_H) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 })
    );
    mesh.position.set(cx, h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    colliders.push({
        minX: cx - w / 2, maxX: cx + w / 2,
        minZ: cz - d / 2, maxZ: cz + d / 2
    });
    wallMeshes.push(mesh);
    return mesh;
}

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ARENA_W, ARENA_L),
    new THREE.MeshStandardMaterial({ color: 0x3b3f3c, roughness: 1 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

addWall(-ARENA_W / 2 - WALL_T / 2, 0, WALL_T, ARENA_L + 2 * WALL_T);
addWall( ARENA_W / 2 + WALL_T / 2, 0, WALL_T, ARENA_L + 2 * WALL_T);
addWall(0, -ARENA_L / 2 - WALL_T / 2, ARENA_W + 2 * WALL_T, WALL_T);
addWall(0,  ARENA_L / 2 + WALL_T / 2, ARENA_W + 2 * WALL_T, WALL_T);

const WALL_ROWS = [50, 25, 0, -25, -50];

WALL_ROWS.forEach((z, i) => {
    if (i % 2 === 0) {
        addWall(-6, z, 48, WALL_T);
    } else {
        addWall( 6, z, 48, WALL_T);
    }
});

const CRATES = [
    [-12, 64, 3], [14, 68, 2.5],
    [-6, 38, 3],  [10, 42, 2],
    [-14, 12, 3], [8, 14, 2.5],
    [14, -12, 3], [-8, -14, 2.5],
    [-12, -38, 3], [6, -36, 2.5]
];

for (const [x, z, size] of CRATES) {
    addWall(x, z, size, size, 0x7a5c3a, size);
}

const startPad = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: 0x3366cc })
);
startPad.position.set(START_POS.x, 0.05, START_POS.z);
startPad.receiveShadow = true;
scene.add(startPad);

const extractionPad = new THREE.Mesh(
    new THREE.BoxGeometry(EXTRACTION.size, 0.1, EXTRACTION.size),
    new THREE.MeshStandardMaterial({ color: 0x22cc66, emissive: 0x0a5a2a })
);
extractionPad.position.set(EXTRACTION.x, 0.05, EXTRACTION.z);
extractionPad.receiveShadow = true;
scene.add(extractionPad);

const elevatorMat = new THREE.MeshStandardMaterial({ color: 0x8c969e, metalness: 0.4, roughness: 0.5 });
const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), elevatorMat);
leftPillar.position.set(-3.5, 2.1, -74);
const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), elevatorMat);
rightPillar.position.set(3.5, 2.1, -74);
const topBeam = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.8, 0.8), elevatorMat);
topBeam.position.set(0, 4.2, -74);
scene.add(leftPillar, rightPillar, topBeam);


const hud = document.querySelector('#hud');
const messageEl = document.querySelector('#message');
const loader = new GLTFLoader();

const weaponHolder = new THREE.Group();
const WEAPON_BASE_POS = new THREE.Vector3(0.28, -0.22, -0.65);
weaponHolder.position.copy(WEAPON_BASE_POS);
camera.add(weaponHolder);

let recoilOffset = 0;

const weapons = {
    1: { name: 'Escopeta', ammo: 2,  maxAmmo: 6, model: null },
    2: { name: 'Rifle',    ammo: 4, maxAmmo: 8, model: null }
};
let currentWeapon = 1;

function updateHUD() {
    const w = weapons[currentWeapon];
    const aliveCount = zombies.filter(z => z.alive).length;
    hud.innerHTML = `
        <div style="font-size:16px; color:#a7b5c6;">Zombis restantes: ${aliveCount}</div>
        <div style="font-size:18px; color:#ffc107;">[1] Escopeta: ${weapons[1].ammo} · [2] Rifle: ${weapons[2].ammo}</div>
        <div>${w.name}: ${w.ammo}</div>
    `;
}

function selectWeapon(slot) {
    if (!weapons[slot] || gameEnded) return;
    currentWeapon = slot;

    if (weapons[1].model) weapons[1].model.visible = (slot === 1);
    if (weapons[2].model) weapons[2].model.visible = (slot === 2);

    updateHUD();
}

function loadWeaponModel(path, slot, targetLength) {
    loader.load(
        path,
        (gltf) => {
            const rawModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(rawModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            rawModel.position.sub(center);

            const pivot = new THREE.Group();
            const maxDim = Math.max(size.x, size.y, size.z);
            pivot.scale.setScalar(targetLength / maxDim);
            pivot.rotation.y = Math.PI;
            pivot.add(rawModel);

            pivot.visible = (currentWeapon === slot);
            weapons[slot].model = pivot;
            weaponHolder.add(pivot);
        },
        undefined,
        (err) => console.error(`No se pudo cargar ${path}:`, err)
    );
}

loadWeaponModel('./models/Shotgun.glb', 1, 0.75);
loadWeaponModel('./models/Rifle.glb',   2, 0.85);



const DETECTION_RANGE = 18;
const CATCH_RANGE = 1.1;
const ZOMBIE_SPEED = 5.2;
const ZOMBIE_RADIUS = 0.45;

const ZOMBIE_SPAWNS = [
    [18, 56],
    [24, 58, 5.0],

    [-16, 40],
    [12, 34],
    [-23, 30, 5.0],

    [-18, 16],
    [14, 10],
    [22, 5],

    [-10, -8],
    [16, -18],
    [-22, -21, 5.2],

    [-16, -34],
    [10, -42],
    [-6, -58],
    [0, -61, 5.2],
    [6, -58]
];

const zombies = [];
const zombieMeshes = [];

loader.load(
    './models/zombie.glb',
    (gltf) => {
        const template = gltf.scene;

        const box = new THREE.Box3().setFromObject(template);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.75 / size.y;
        template.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(template);
        template.position.y = -scaledBox.min.y;
        template.rotation.y = -Math.PI / 2;

       for (const [x, z, speed = ZOMBIE_SPEED] of ZOMBIE_SPAWNS) {
            const group = new THREE.Group();
            const clone = template.clone();

            clone.traverse((child) => {
                if (child.isMesh) {
                    child.material = child.material.clone();
                    child.castShadow = true;
                    child.userData.zombieIndex = zombies.length;
                    zombieMeshes.push(child);
                }
            });

            group.add(clone);
            group.position.set(x, 0, z);
            scene.add(group);

            zombies.push({
                group,
                hp: 2,
                speed,
                alive: true,
                active: false,
                hitTimer: 0
            });
        }

        updateHUD();
    },
    undefined,
    (err) => console.error('No se pudo cargar zombie.glb:', err)
);

const raycaster = new THREE.Raycaster();

function shoot() {
    if (!controls.isLocked || gameEnded) return;

    const w = weapons[currentWeapon];
    if (w.ammo <= 0) return;

    w.ammo--;
    recoilOffset = 0.12;

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = raycaster.intersectObjects(zombieMeshes, false);

    if (hits.length > 0) {
        const hit = hits[0];
        const idx = hit.object.userData.zombieIndex;
        const z = zombies[idx];

        if (z && z.alive) {
            const wallHits = raycaster.intersectObjects(wallMeshes, false);
            const blockedByWall = wallHits.length > 0 && wallHits[0].distance < hit.distance;

            if (!blockedByWall) {
                z.hp--;
                z.active = true;
                z.hitTimer = 0.18;

                if (z.hp <= 0) {
                    z.alive = false;
                    z.active = false;
                    z.group.rotation.x = -Math.PI / 2;
                    z.group.position.y = 0.2;
                }
            }
        }
    }

    updateHUD();
}

window.addEventListener('mousedown', (e) => {
    if (e.button === 0) shoot();
});

function updateZombies(delta) {
    if (!controls.isLocked || gameEnded) return;

    for (const z of zombies) {
        if (z.hitTimer > 0) {
            z.hitTimer -= delta;
            z.group.traverse((c) => {
                if (c.isMesh && c.material.emissive) {
                    c.material.emissive.setHex(z.hitTimer > 0 ? 0x660000 : 0x000000);
                }
            });
        }

        if (!z.alive) continue;

        const dx = camera.position.x - z.group.position.x;
        const dz = camera.position.z - z.group.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= CATCH_RANGE) {
            endGame(false);
            return;
        }

        if (!z.active && dist <= DETECTION_RANGE) {
            z.active = true;
        }

        if (z.active && dist > 0.1) {
            z.group.rotation.y = Math.atan2(dx, dz);

            const step = ZOMBIE_SPEED * delta;
            const moveX = (dx / dist) * step;
            const moveZ = (dz / dist) * step;

            const oldX = z.group.position.x;
            const oldZ = z.group.position.z;

            z.group.position.x += moveX;
            if (collides(z.group.position.x, oldZ, ZOMBIE_RADIUS)) {
                z.group.position.x = oldX;
            }

            z.group.position.z += moveZ;
            if (collides(z.group.position.x, z.group.position.z, ZOMBIE_RADIUS)) {
                z.group.position.z = oldZ;
            }
        }
    }
}



const AMMO_SPAWNS = [
    [22, 58],
    [-22, 32],
    [20, 6],
    [-20, -20],
    [18, -44]
];

const ammoPickups = [];
const ammoGeo = new THREE.BoxGeometry(0.7, 0.5, 0.7);
const ammoMat = new THREE.MeshStandardMaterial({
    color: 0xffc107,
    emissive: 0x664400,
    roughness: 0.4
});

for (const [x, z] of AMMO_SPAWNS) {
    const box = new THREE.Mesh(ammoGeo, ammoMat);
    box.position.set(x, 0.45, z);
    box.castShadow = true;
    scene.add(box);
    ammoPickups.push(box);
}

function updatePickups(delta) {
    if (gameEnded) return;

    for (let i = ammoPickups.length - 1; i >= 0; i--) {
        const box = ammoPickups[i];
        box.rotation.y += 1.5 * delta;

        const dx = camera.position.x - box.position.x;
        const dz = camera.position.z - box.position.z;

        if (dx * dx + dz * dz < 1.6 * 1.6) {
            weapons[1].ammo = Math.min(weapons[1].maxAmmo, weapons[1].ammo + 4);
            weapons[2].ammo = Math.min(weapons[2].maxAmmo, weapons[2].ammo + 6);
            scene.remove(box);
            ammoPickups.splice(i, 1);
            updateHUD();
        }
    }
}



let gameEnded = false;

function endGame(victory) {
    if (gameEnded) return;
    gameEnded = true;
    controls.unlock();

    const title = victory
        ? '<span style="color:#22cc66;">¡MISIÓN COMPLETADA!</span><br><span style="font-size:24px;">Has llegado al ascensor. Sobreviviste, por ahora....</span>'
        : '<span style="color:#ff4444;">GAME OVER</span><br><span style="font-size:24px;">Has sido atrapado por los infectados.</span>';

    messageEl.innerHTML = `
        <div>
            ${title}
            <br><br>
            <button id="restartBtn" style="padding:12px 26px; font-size:20px; font-weight:bold; border:none; border-radius:8px; background:#ffc107; color:#111; cursor:pointer;">
                Reiniciar misión
            </button>
        </div>
    `;
    messageEl.style.display = 'grid';

    document.getElementById('restartBtn').addEventListener('click', () => {
        window.location.reload();
    });
}

function checkExtraction() {
    if (gameEnded) return;
    const half = EXTRACTION.size / 2;
    const inX = Math.abs(camera.position.x - EXTRACTION.x) <= half;
    const inZ = Math.abs(camera.position.z - EXTRACTION.z) <= half;

    if (inX && inZ) {
        endGame(true);
    }
}

updateHUD();

const controls = new PointerLockControls(camera, document.body);
const menu = document.querySelector('#menu');

menu.addEventListener('click', () => {
    if (!gameEnded) controls.lock();
});
controls.addEventListener('lock', () => { menu.style.display = 'none'; });
controls.addEventListener('unlock', () => {
    if (!gameEnded) menu.style.display = 'grid';
});

const keys = {};
window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    keys[k] = true;

    if (k === '1') selectWeapon(1);
    if (k === '2') selectWeapon(2);
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function collides(x, z, radius = PLAYER_RADIUS) {
    for (const c of colliders) {
        const closestX = THREE.MathUtils.clamp(x, c.minX, c.maxX);
        const closestZ = THREE.MathUtils.clamp(z, c.minZ, c.maxZ);
        const dx = x - closestX;
        const dz = z - closestZ;
        if (dx * dx + dz * dz < radius * radius) return true;
    }
    return false;
}

function updatePlayer(delta) {
    if (!controls.isLocked || gameEnded) return;

    const step = WALK_SPEED * delta;
    const oldX = camera.position.x;
    const oldZ = camera.position.z;

    if (keys['w']) controls.moveForward(step);
    if (keys['s']) controls.moveForward(-step);
    if (keys['a']) controls.moveRight(-step);
    if (keys['d']) controls.moveRight(step);

    const newX = camera.position.x;
    const newZ = camera.position.z;

    camera.position.set(newX, PLAYER_HEIGHT, oldZ);
    if (collides(camera.position.x, camera.position.z)) camera.position.x = oldX;

    camera.position.z = newZ;
    if (collides(camera.position.x, camera.position.z)) camera.position.z = oldZ;

    camera.position.y = PLAYER_HEIGHT;

    checkExtraction();
}

function updateWeaponVisuals(delta) {
    recoilOffset = THREE.MathUtils.lerp(recoilOffset, 0, Math.min(1, delta * 15));
    weaponHolder.position.z = WEAPON_BASE_POS.z + recoilOffset;
}


const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    updatePlayer(delta);
    updateWeaponVisuals(delta);
    updateZombies(delta);
    updatePickups(delta);

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});