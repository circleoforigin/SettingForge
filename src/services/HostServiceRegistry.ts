import type {
  HostServiceDefinition,
} from './HostServiceDefinition';

export class HostServiceRegistry {
  private readonly services =
    new Map<string, HostServiceDefinition>();

  register(
    definition: HostServiceDefinition
  ): void {
    if (this.services.has(definition.type)) {
      throw new Error(
        `Host service "${definition.type}" is already registered.`
      );
    }

    this.services.set(
      definition.type,
      definition
    );
  }

  get(
    type: string
  ): HostServiceDefinition | undefined {
    return this.services.get(type);
  }

  getAll(): HostServiceDefinition[] {
    return Array.from(
      this.services.values()
    );
  }
}

export const hostServiceRegistry =
  new HostServiceRegistry();