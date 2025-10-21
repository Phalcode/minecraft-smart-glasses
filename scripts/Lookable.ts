import { Block, Entity } from "@minecraft/server";

export class Lookable {
  name: string = "Unknown";
  namespace: string = "Minecraft";
  location: { x: number; y: number; z: number };
  health?: { current: number; max: number };
  inventoryInfo?: { used: number; total: number };

  constructor(public readonly lookable: Entity | Block) {
    this.location = lookable.location;
    this.fetchType(lookable.typeId);

    if (lookable instanceof Entity) {
      this.health = this.fetchEntityHealth(lookable);
    } else {
      // Block specific augmentation (e.g., chests)
      this.inventoryInfo = this.fetchBlockInventoryInfo(lookable);
    }
  }

  public toString(): string {
    let sb = `(${this.namespace}) ${this.name}`; //[${this.lookable.typeId}];

    if (this.health) {
      sb += ` (${this.health.current}/${this.health.max} HP)`;
    }

    if (this.inventoryInfo) {
      const { used, total } = this.inventoryInfo;
      sb += ` [Inv ${used}/${total}]`;
    }

    // Append integer coordinates (block space)
    const x = Math.floor(this.location.x);
    const y = Math.floor(this.location.y);
    const z = Math.floor(this.location.z);
    sb += ` @${x},${y},${z}`;
    return sb;
  }

  private fetchType(id: string) {
    const [namespace, key] = id.split(":");
    if (!namespace || !key) return id;

    // Convert underscore-separated words to Title Case with spaces
    const formattedKey = key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Convert namespace underscores to spaces, each word capitalized
    const formattedNamespace = namespace
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    this.name = formattedKey;
    this.namespace = formattedNamespace;
  }

  private fetchEntityHealth(entity: Entity): { current: number; max: number } | undefined {
    const healthComponent = entity.getComponent("minecraft:health");
    if (!healthComponent) {
      return undefined;
    }
    return { current: Math.round(healthComponent.currentValue), max: Math.round(healthComponent.defaultValue) };
  }

  private fetchBlockInventoryInfo(block: Block): { used: number; total: number } | undefined {
    try {
      const inventoryComp: any = (block as any).getComponent?.("minecraft:inventory");
      if (!inventoryComp) return undefined;
      const container = inventoryComp.container;
      if (!container) return undefined;
      const total = container.size ?? 0;
      let used = 0;
      for (let i = 0; i < total; i++) {
        const item = container.getItem(i);
        if (item) used++;
      }
      return { used, total };
    } catch {
      return undefined;
    }
  }
}
