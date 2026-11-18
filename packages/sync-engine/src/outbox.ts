import type { OutboxStore, OutboxItem, OutboxEnqueueInput, OutboxStatus } from './types';

export class InMemoryOutboxStore implements OutboxStore {
  private items = new Map<string, OutboxItem>();

  async enqueue(input: OutboxEnqueueInput): Promise<OutboxItem> {
    const id = input.id ?? crypto.randomUUID();
    const item: OutboxItem = {
      ...input,
      id,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.items.set(id, item);
    return { ...item };
  }

  async getPending(limit = 100): Promise<OutboxItem[]> {
    const now = Date.now();
    const pendingList: OutboxItem[] = [];
    for (const item of this.items.values()) {
      if (item.status === 'pending') {
        pendingList.push({ ...item });
      } else if (item.status === 'failed' && item.retryCount < 5) {
        const delayMs = item.retryCount > 1 ? Math.min(1000 * Math.pow(2, item.retryCount - 2), 60000) : 0;
        const lastAttempt = item.lastAttemptAt ? new Date(item.lastAttemptAt).getTime() : 0;
        if (now - lastAttempt >= delayMs) {
          pendingList.push({ ...item });
        }
      }
    }
    pendingList.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return pendingList.slice(0, limit);
  }

  async markInFlight(ids: string[]): Promise<void> {
    const now = new Date().toISOString();
    for (const id of ids) {
      const item = this.items.get(id);
      if (item) {
        item.status = 'in_flight';
        item.lastAttemptAt = now;
      }
    }
  }

  async markSynced(ids: string[]): Promise<void> {
    for (const id of ids) {
      const item = this.items.get(id);
      if (item) {
        item.status = 'synced';
        item.errorMessage = undefined;
      }
    }
  }

  async markFailed(ids: string[], errorMessage?: string): Promise<void> {
    for (const id of ids) {
      const item = this.items.get(id);
      if (item) {
        item.status = 'failed';
        item.retryCount += 1;
        item.errorMessage = errorMessage;
      }
    }
  }

  async pruneSynced(olderThanMs = 60000): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [id, item] of this.items.entries()) {
      if (item.status === 'synced') {
        const itemTime = item.lastAttemptAt ? new Date(item.lastAttemptAt).getTime() : new Date(item.createdAt).getTime();
        if (now - itemTime >= olderThanMs) {
          this.items.delete(id);
          count++;
        }
      }
    }
    return count;
  }

  async getStats(): Promise<{ pending: number; inFlight: number; failed: number; synced: number }> {
    let pending = 0;
    let inFlight = 0;
    let failed = 0;
    let synced = 0;

    for (const item of this.items.values()) {
      switch (item.status) {
        case 'pending':
          pending++;
          break;
        case 'in_flight':
          inFlight++;
          break;
        case 'failed':
          failed++;
          break;
        case 'synced':
          synced++;
          break;
      }
    }

    return { pending, inFlight, failed, synced };
  }

  async clear(): Promise<void> {
    this.items.clear();
  }
}
