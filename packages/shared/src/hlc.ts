export interface HLCTimestamp {
  millis: number;
  counter: number;
  nodeId: string;
}

export class HybridLogicalClock {
  private millis: number;
  private counter: number;
  private nodeId: string;

  constructor(nodeId: string, initialMillis: number = 0, initialCounter: number = 0) {
    this.nodeId = nodeId;
    this.millis = initialMillis;
    this.counter = initialCounter;
  }

  public getTimestamp(): HLCTimestamp {
    return {
      millis: this.millis,
      counter: this.counter,
      nodeId: this.nodeId,
    };
  }

  public send(): HLCTimestamp {
    const physical = Date.now();
    if (physical > this.millis) {
      this.millis = physical;
      this.counter = 0;
    } else {
      this.counter += 1;
    }
    return this.getTimestamp();
  }

  public recv(remote: HLCTimestamp): HLCTimestamp {
    const physical = Date.now();
    const maxMillis = Math.max(physical, this.millis, remote.millis);

    if (maxMillis === this.millis && maxMillis === remote.millis) {
      this.counter = Math.max(this.counter, remote.counter) + 1;
    } else if (maxMillis === this.millis) {
      this.counter += 1;
    } else if (maxMillis === remote.millis) {
      this.counter = remote.counter + 1;
    } else {
      this.counter = 0;
    }

    this.millis = maxMillis;
    return this.getTimestamp();
  }

  public static compare(a: HLCTimestamp, b: HLCTimestamp): number {
    if (a.millis !== b.millis) {
      return a.millis - b.millis;
    }
    if (a.counter !== b.counter) {
      return a.counter - b.counter;
    }
    return a.nodeId.localeCompare(b.nodeId);
  }

  public static pack(ts: HLCTimestamp): string {
    const iso = new Date(ts.millis).toISOString();
    const counterHex = ts.counter.toString(16).padStart(8, '0');
    return `${iso}_${counterHex}_${ts.nodeId}`;
  }

  public static unpack(raw: string): HLCTimestamp {
    const parts = raw.split('_');
    if (parts.length < 3) {
      throw new Error(`Invalid packed HLC timestamp: ${raw}`);
    }
    const iso = parts[0];
    const counterHex = parts[1];
    const nodeId = parts.slice(2).join('_');

    const millis = new Date(iso).getTime();
    const counter = parseInt(counterHex, 16);

    return { millis, counter, nodeId };
  }
}
