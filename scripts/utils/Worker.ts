import { Client } from "kol.js";

export function parseWorkers(environment: Record<string, string | undefined>) {
  return Object.entries(environment)
    .filter(([k, v]) => k.startsWith("WORKER_") && v !== undefined)
    .map(([, v]) => {
      const [username, password] = v!.split(",");

      return new Worker(username, password);
    });
}

export class Worker extends Client {
  #busy = false;
  isBusy() {
    return this.#busy;
  }

  async run<T>(cb: (client: Worker) => Promise<T>) {
    this.#busy = true;
    const result = await cb(this);
    this.#busy = false;
    return result;
  }
}
