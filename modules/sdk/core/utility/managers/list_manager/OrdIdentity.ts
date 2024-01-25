export class OrdIdentity {
  private readonly ord: number;
  private static lastOrdId: number = 0;

  constructor() {
    this.ord = OrdIdentity.lastOrdId++;
  }

  getOrd(): number {
    return this.ord;
  }
}
