import type { SimClockEra } from './SimClockSettings';
import { hostEventBroker } from '../events/HostEventBroker';

export type SimulationTime = number;

export type SimulationClockListener =
  (time: SimulationTime) => void;

export class SimulationClockService
{
  private time: SimulationTime = 0;
private activeEra: SimClockEra | undefined;

getActiveEra(): SimClockEra | undefined
{
  return this.activeEra
    ? structuredClone(this.activeEra)
    : undefined;
}

setActiveEra(era: SimClockEra): void
{
  this.activeEra = structuredClone(era);

  // Existing clock subscribers must also refresh
  // when calendar configuration changes.
  for (const listener of this.listeners)
  {
    listener(this.time);
  }

  this.broadcastClockState();
}
  private readonly listeners =
    new Set<SimulationClockListener>();

  getTime(): SimulationTime
  {
    return this.time;
  }

  private broadcastClockState(): void
{
  hostEventBroker.broadcast(
    'Simulation.TimeCommitted',
    {
      time: this.time,
      era: this.getActiveEra(),
    }
  );
}

  setTime(time: SimulationTime): void
{
  if (!Number.isFinite(time))
    return;

  const normalizedTime =
    Math.trunc(time);

  if (this.time === normalizedTime)
    return;

  this.time = normalizedTime;

  for (const listener of this.listeners)
  {
    listener(this.time);
  }

  this.broadcastClockState();
}

  subscribe(
    listener: SimulationClockListener
  ): () => void
  {
    this.listeners.add(listener);

    return () =>
    {
      this.listeners.delete(listener);
    };
  }
}

export const simulationClockService =
  new SimulationClockService();

hostEventBroker.registerRequestHandler(
  'Simulation.GetClockState',
  async () =>
  {
    return {
      time:
        simulationClockService.getTime(),

      era:
        simulationClockService.getActiveEra(),
    };
  }
);