export class SeededPRNG {
  private seed: number;

  constructor(seedText: string) {
    let hash = 0;
    for (let i = 0; i < seedText.length; i += 1) {
      hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
    }
    this.seed = hash || 1;
  }

  next(): number {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max));
  }

  select<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}
