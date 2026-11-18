import type { RealtimeSyncEvent } from '@homedash/protocol';

export type SyncEventHandler = (event: RealtimeSyncEvent) => void;

export class SyncPubSub {
  private channels = new Map<string, Set<SyncEventHandler>>();

  private getChannelKey(householdId: string): string {
    return `household:${householdId}:sync`;
  }

  public subscribe(householdId: string, handler: SyncEventHandler): () => void {
    const key = this.getChannelKey(householdId);
    let handlers = this.channels.get(key);
    if (!handlers) {
      handlers = new Set();
      this.channels.set(key, handlers);
    }
    handlers.add(handler);

    return () => {
      handlers?.delete(handler);
      if (handlers?.size === 0) {
        this.channels.delete(key);
      }
    };
  }

  public async publishInvalidation(
    householdId: string,
    highwaterMark: number,
    sourceClientId?: string
  ): Promise<void> {
    const event: RealtimeSyncEvent = {
      type: 'sync:invalidate',
      householdId,
      highwaterMark,
      sourceClientId,
      timestamp: new Date().toISOString(),
    };

    const key = this.getChannelKey(householdId);
    const handlers = this.channels.get(key);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch {
          // Ignore subscriber error
        }
      }
    }
  }

  public clear(): void {
    this.channels.clear();
  }
}
