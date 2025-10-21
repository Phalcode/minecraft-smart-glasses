import { Entity, EquipmentSlot, Player, TicksPerSecond, system, world } from "@minecraft/server";
import { Lookable } from "./Lookable";

// Config
const MAX_DISTANCE = 4;
const INTERVAL_TICKS = 2; // 50ms per tick
const ONLY_WHEN_CHANGED = true;
const LOG_WHEN_NONE = false;
const STEP = 0.25;
const EYE_HEIGHT = 1.62;
const SKIP_IF_STATIONARY = true;
const REQUIRED_HELMET_TYPE = "smart_glasses:smart_glasses";

const PASS_THROUGH_SET = new Set([
  "minecraft:air",
  "minecraft:arrow",
  "minecraft:bubble_column",
  "minecraft:falling_block",
  "minecraft:fishing_bobber",
  "minecraft:fishing_hook",
  "minecraft:flowing_lava",
  "minecraft:flowing_water",
  "minecraft:item",
  "minecraft:lava",
  "minecraft:lightning_bolt",
  "minecraft:powder_snow",
  "minecraft:water",
  "minecraft:xp_orb",
]);

function isPassThrough(typeId: string): boolean {
  return PASS_THROUGH_SET.has(typeId);
}

function getHelmetFromEquip(equip: any): any | null {
  const helmetKeys = [EquipmentSlot.Head, "head", "slot.armor.head"];
  for (const key of helmetKeys) {
    try {
      const head = equip.getEquipment?.(key);
      if (head) return head;
    } catch {}
  }
  return null;
}

function hasRequiredHelmet(player: Player): boolean {
  const equip: any = (player as any).getComponent?.("minecraft:equippable");
  if (!equip) return false;

  const head = getHelmetFromEquip(equip);
  if (!head) return false;

  return head.typeId === REQUIRED_HELMET_TYPE;
}

const lastHit = new Map<string, string | null>();
interface LastState {
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
}
const lastPlayerState = new Map<string, LastState>();

function isPointInsideEntity(entity: Entity, x: number, y: number, z: number): boolean {
  const loc = entity.location;
  const half = 0.4;
  return (
    x >= loc.x - half && x <= loc.x + half && z >= loc.z - half && z <= loc.z + half && y >= loc.y && y <= loc.y + 2
  );
}

function hasPlayerMovedOrRotated(
  player: Player,
  dx: number,
  dy: number,
  dz: number,
  ox: number,
  oy: number,
  oz: number
): boolean {
  const prev = lastPlayerState.get(player.id);
  if (!prev) return true;

  const moved = prev.x !== ox || prev.y !== oy - EYE_HEIGHT || prev.z !== oz;
  const rotated = prev.dx !== dx || prev.dy !== dy || prev.dz !== dz;
  return moved || rotated;
}

function updatePlayerState(
  player: Player,
  dx: number,
  dy: number,
  dz: number,
  ox: number,
  oy: number,
  oz: number
): void {
  lastPlayerState.set(player.id, { x: ox, y: oy - EYE_HEIGHT, z: oz, dx, dy, dz });
}

function findHitEntity(
  player: Player,
  nearbyEntities: Entity[],
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  px: number,
  py: number,
  pz: number
): Entity | null {
  for (const ent of nearbyEntities) {
    if (ent.id === player.id) continue;
    const ex = ent.location.x;
    const ey = ent.location.y + 1; // eye height adjustment
    const ez = ent.location.z;

    const vx = ex - ox;
    const vy = ey - oy;
    const vz = ez - oz;

    const proj = vx * dx + vy * dy + vz * dz;
    if (proj < 0) continue;

    const lateralSq = vx * vx + vy * vy + vz * vz - proj * proj;
    if (lateralSq > 0.5) continue;

    if (isPointInsideEntity(ent, px, py, pz)) {
      if (!ent || isPassThrough(ent.typeId)) return null;
      return ent;
    }
  }
  return null;
}

function findHitBlock(player: Player, px: number, py: number, pz: number): any | null {
  const bx = Math.floor(px);
  const by = Math.floor(py);
  const bz = Math.floor(pz);
  const block = player.dimension.getBlock({ x: bx, y: by, z: bz });
  if (!block || isPassThrough(block.typeId)) return null;
  return block;
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    try {
      if (!hasRequiredHelmet(player)) continue;

      const dir = player.getViewDirection();
      const eye = player.location;
      const ox = eye.x;
      const oy = eye.y + EYE_HEIGHT;
      const oz = eye.z;
      const dx = dir.x;
      const dy = dir.y;
      const dz = dir.z;

      // Apply night vision
      player.addEffect("minecraft:night_vision", TicksPerSecond * 15, { showParticles: false });

      if (SKIP_IF_STATIONARY && ONLY_WHEN_CHANGED && !hasPlayerMovedOrRotated(player, dx, dy, dz, ox, oy, oz)) {
        continue;
      }
      updatePlayerState(player, dx, dy, dz, ox, oy, oz);

      const steps = Math.ceil(MAX_DISTANCE / STEP);
      const nearbyEntities = player.dimension.getEntities({ location: player.location, maxDistance: MAX_DISTANCE + 2 });

      let hitEntity: Entity | null = null;
      let hitBlock: any = null;

      for (let i = 0; i <= steps; i++) {
        const dist = i * STEP;
        const px = ox + dx * dist;
        const py = oy + dy * dist;
        const pz = oz + dz * dist;

        if (!hitEntity) {
          hitEntity = findHitEntity(player, nearbyEntities, ox, oy, oz, dx, dy, dz, px, py, pz);
        }

        if (!hitBlock) {
          hitBlock = findHitBlock(player, px, py, pz);
        }

        if (hitEntity || hitBlock) break;
      }

      const prev = lastHit.get(player.id) ?? null;
      let current: string | null = null;

      if (hitEntity) {
        current = `ENTITY:${hitEntity.typeId}`;
      } else if (hitBlock) {
        current = `${hitBlock.typeId}@${hitBlock.location.x},${hitBlock.location.y},${hitBlock.location.z}`;
      }

      if (ONLY_WHEN_CHANGED && current === prev) continue;

      if (current) {
        const lookable = new Lookable(hitEntity || hitBlock);
        //console.warn(`[Smart Glasses] ${player.name} -> ${lookable.toString()}`);
        try {
          // Use Molang-compatible encoding similar to the sample pack
          const blockName = lookable.toString();
          // Format: _sglss:<type>:<name>
          // Type: A for blocks, B for entities
          const entityType = hitEntity ? "B" : "A";
          const encodedTitle = `_sglss:${entityType}:${blockName}`;

          player.onScreenDisplay.setTitle(encodedTitle, {
            fadeInDuration: 0,
            fadeOutDuration: 0,
            stayDuration: 100,
          });
        } catch (error) {
          console.warn("HUD Update Error:", error);
        }
      } else if (LOG_WHEN_NONE && prev !== null) {
        console.warn(`[Smart Glasses] ${player.name} -> (nothing)`);
      }

      lastHit.set(player.id, current);
    } catch (e) {
      console.error(`[Smart Glasses] Error for ${player.name}: ${(e as Error).message}`);
    }
  }
}, INTERVAL_TICKS);

console.warn(
  `[Smart Glasses] Initialized (maxDist=${MAX_DISTANCE}, step=${STEP}, interval=${INTERVAL_TICKS}, onlyChanged=${ONLY_WHEN_CHANGED}).`
);

try {
  (world.afterEvents as any)?.playerLeave?.subscribe((ev: any) => {
    lastHit.delete(ev.playerId);
  });
} catch {
  // Ignore subscription errors
}
