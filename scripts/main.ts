import { system, world, Player, Entity, EquipmentSlot } from "@minecraft/server";

// Config
const MAX_DISTANCE = 4;
const INTERVAL_TICKS = 2;//50ms per tick
const ONLY_WHEN_CHANGED = true;
const LOG_WHEN_NONE = false;
const STEP = 0.25;
const EYE_HEIGHT = 1.62;
const SKIP_IF_STATIONARY = true;
const REQUIRED_HELMET_TYPE = "smart_glasses:smart_glasses"; // Only run logic when player wears this

const PASS_THROUGH_SET = new Set([
  "minecraft:air",
  "minecraft:water",
  "minecraft:lava",
  "minecraft:flowing_water",
  "minecraft:flowing_lava",
]);

function isPassThrough(typeId: string): boolean {
  return PASS_THROUGH_SET.has(typeId);
}

function hasRequiredHelmet(player: Player): boolean {
  const equip: any = (player as any).getComponent?.("minecraft:equippable");
  if (!equip) return false;

  let head: any = null;
  let tried: string[] = [];
  try {
    head = equip.getEquipment?.(EquipmentSlot.Head);
    tried.push("EquipmentSlot.Head");
  } catch (e: any) {
     return false;
    //console.warn(`[TargetSight] Helmet check: EquipmentSlot.Head failed: ${e?.message || e}`);
  }
  
  if (!head) {
    try {
      head = equip.getEquipment?.("head");
      tried.push("head");
    } catch (e: any) {
      return false;
      //console.warn(`[TargetSight] Helmet check: 'head' failed: ${e?.message || e}`);
    }
  }
  
  if (!head) {
    try {
      head = equip.getEquipment?.("slot.armor.head");
      tried.push("slot.armor.head");
    } catch (e: any) {
       return false;
      //console.warn(`[TargetSight] Helmet check: 'slot.armor.head' failed: ${e?.message || e}`);
    }
  }

  if (!head) {
    return false;
  }

  const ok = head.typeId === REQUIRED_HELMET_TYPE;
  // console.warn(head.typeId, REQUIRED_HELMET_TYPE);
  return ok;
}

const lastHit = new Map<string, string | null>();
interface LastState { x: number; y: number; z: number; dx: number; dy: number; dz: number; }
const lastPlayerState = new Map<string, LastState>();

function formatBlock(block: any): string {
  return `${block.typeId} @ ${block.location.x},${block.location.y},${block.location.z}`;
}

function formatEntity(entity: Entity): string {
  const loc = entity.location;
  return `${entity.typeId} @ ${Math.floor(loc.x)},${Math.floor(loc.y)},${Math.floor(loc.z)}`;
}

function isPointInsideEntity(entity: Entity, x: number, y: number, z: number): boolean {
  const loc = entity.location;
  const half = 0.4;
  const minX = loc.x - half;
  const maxX = loc.x + half;
  const minZ = loc.z - half;
  const maxZ = loc.z + half;
  const minY = loc.y;
  const maxY = loc.y + 2; // tall mobs up to ~2 blocks
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ && y >= minY && y <= maxY;
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    try {
      if (!hasRequiredHelmet(player)) {
        // Optionally uncomment to debug filtering:
        // console.warn(`[TargetSight] Skipping ${player.name} (no iron helmet).`);
        continue;
      }
      const dir = player.getViewDirection();
      const eye = player.location;
      const ox = eye.x;
      const oy = eye.y + EYE_HEIGHT;
      const oz = eye.z;
      const dx = dir.x;
      const dy = dir.y;
      const dz = dir.z;

      if (SKIP_IF_STATIONARY) {
        const prevState = lastPlayerState.get(player.id);
        if (prevState) {
          const moved = (prevState.x !== ox) || (prevState.y !== oy - EYE_HEIGHT) || (prevState.z !== oz);
          const rotated = (prevState.dx !== dx) || (prevState.dy !== dy) || (prevState.dz !== dz);
          if (!moved && !rotated && ONLY_WHEN_CHANGED) {
            continue;
          }
        }
        lastPlayerState.set(player.id, { x: ox, y: oy - EYE_HEIGHT, z: oz, dx, dy, dz });
      }

      let hitBlock: any = null;
      let hitEntity: Entity | null = null;

      const steps = Math.ceil(MAX_DISTANCE / STEP);
      const nearbyEntities = player.dimension.getEntities({ location: player.location, maxDistance: MAX_DISTANCE + 2 });
      for (let i = 0; i <= steps; i++) {
        const dist = i * STEP;
        const px = ox + dx * dist;
        const py = oy + dy * dist;
        const pz = oz + dz * dist;

        if (!hitEntity) {
          for (const ent of nearbyEntities) {
            if (ent.id === player.id) continue;
            const ex = ent.location.x;
            const ey = ent.location.y + 1;
            const ez = ent.location.z;
            const vx = ex - ox;
            const vy = ey - oy;
            const vz = ez - oz;
            const proj = vx * dx + vy * dy + vz * dz;
            if (proj < 0) continue;
            const lateralSq = (vx * vx + vy * vy + vz * vz) - proj * proj;
            if (lateralSq > 0.5) continue;
            if (isPointInsideEntity(ent, px, py, pz)) {
              hitEntity = ent;
              break;
            }
          }
        }

        const bx = Math.floor(px);
        const by = Math.floor(py);
        const bz = Math.floor(pz);
        const b = player.dimension.getBlock({ x: bx, y: by, z: bz });
        if (!b) continue;
        if (isPassThrough(b.typeId)) continue;
        hitBlock = b;
        break;
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
        if (hitEntity) {
          console.warn(`[TargetSight] ${player.name} -> Entity ${formatEntity(hitEntity)}`);
        } else if (hitBlock) {
          console.warn(`[TargetSight] ${player.name} -> Block ${formatBlock(hitBlock)}`);
        }
      } else if (LOG_WHEN_NONE) {
        if (prev !== null) console.warn(`[TargetSight] ${player.name} -> (nothing)`);
      }
      lastHit.set(player.id, current);
    } catch (e) {
      console.error(`[TargetSight] Error for ${player.name}: ${(e as Error).message}`);
    }
  }
}, INTERVAL_TICKS);

console.warn(`[TargetSight] Initialized (maxDist=${MAX_DISTANCE}, step=${STEP}, interval=${INTERVAL_TICKS}, onlyChanged=${ONLY_WHEN_CHANGED}).`);

try {
  (world.afterEvents as any)?.playerLeave?.subscribe((ev: any) => {
    lastHit.delete(ev.playerId);
  });
} catch {}
