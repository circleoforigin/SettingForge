export type SimulationTime = number;

export type SimulationClockListener =
  (time: SimulationTime) => void;

export class SimulationClockService
{
  private time: SimulationTime = 0;

  private readonly listeners =
    new Set<SimulationClockListener>();

  getTime(): SimulationTime
  {
    return this.time;
  }

  setTime(time: SimulationTime): void
  {
    if (!Number.isFinite(time))
      return;

    if (this.time === time)
      return;

    this.time = time;

    for (const listener of this.listeners)
    {
      listener(this.time);
    }
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