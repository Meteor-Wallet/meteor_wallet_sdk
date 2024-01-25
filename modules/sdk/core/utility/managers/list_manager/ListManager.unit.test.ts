import { ListManager } from "./ListManager";
import { MeteorError } from "../../../errors/MeteorError";
import { EErrorId_ListManager } from "../../../errors/MeteorErrorIds";
import { IListManageable } from "./list_manager.interfaces";
import { OrdIdentity } from "./OrdIdentity";
import { EPubSub_ListManager } from "./ListManager.pubsub";

interface IUniqueTestItemProps {
  id: string;
}

class TestItem implements IListManageable<IUniqueTestItemProps> {
  _ord: OrdIdentity = new OrdIdentity();
  color: string = "red";
  readonly id: string;

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  constructor({ id, color }: { id: string; color: string }) {
    this.id = id;
    this.color = color;
  }

  isEqualTo(other: IUniqueTestItemProps): boolean {
    return this.id === other.id;
  }
}

const items: TestItem[] = [
  new TestItem({ id: "1", color: "red" }),
  new TestItem({ id: "2", color: "blue" }),
  new TestItem({ id: "3", color: "green" }),
  new TestItem({ id: "4", color: "red" }),
  new TestItem({ id: "5", color: "green" }),
];

describe("ListManager", () => {
  const listManager = new ListManager<TestItem>();
  let mockSubAddItem: jest.Mock;

  afterEach(() => {
    listManager.removeAll();
    expect(listManager.getAll()).toEqual([]);
  });

  beforeEach(() => {
    listManager.addMultiple(items);
    mockSubAddItem = jest.fn();
  });

  it("Should be able to add items and get an item that exists, or throw if it doesn't", () => {
    const item = listManager.get({ id: "1" });

    expect(item).toEqual(items[0]);
    expect(() => {
      listManager.get({ id: "9999" });
    }).toThrow();
  });

  it("Should be able to remove items and throw an error if they are removed", () => {
    const removedItem = listManager.remove({ id: "1" });
    expect(removedItem).toBe(items[0]);

    // already removed
    expect(() => listManager.remove({ id: "1" })).toThrow();

    expect(listManager.includes(items[0])).toBe(false);

    expect(() => listManager.get({ id: "1" })).toThrow();
  });

  it("Should throw the right errors and they should contain the right context", () => {
    expect(() => listManager.add(items[0])).toThrow();

    try {
      listManager.add(new TestItem({ id: "1", color: "green" }));
    } catch (e) {
      expect(e).toBeInstanceOf(MeteorError);

      if (e instanceof MeteorError) {
        expect(e.has(EErrorId_ListManager.list_item_already_exists)).toBe(true);
        expect(e.getContextForId(EErrorId_ListManager.list_item_already_exists)).toBe(items[0]);
      }
    }
  });

  it("Should be able to add multiple items", () => {
    const listManagerMultiple = new ListManager<TestItem>();

    listManagerMultiple.subscribe(EPubSub_ListManager.item_add, mockSubAddItem);

    listManagerMultiple.addMultiple([items[2], items[3], items[4]]);
    expect(listManagerMultiple.getAll()).toEqual([items[2], items[3], items[4]]);
    expect(mockSubAddItem).toHaveBeenCalledTimes(3);
    expect(mockSubAddItem).toHaveBeenCalledWith(items[2]);
    expect(mockSubAddItem).toHaveBeenCalledWith(items[3]);
    expect(mockSubAddItem).toHaveBeenCalledWith(items[4]);
  });

  it("Should be able to keep only a subset of items", () => {
    listManager.keepOnlyMatching([{ id: "2" }, items[3]]);

    const itemsLeft = [items[1], items[3]];

    expect(listManager.getAll()).toEqual(itemsLeft);

    // Tests exact reference equality
    listManager.getAll().forEach((item, index) => {
      expect(item).toBe(itemsLeft[index]);
    });
  });

  it("Should be able to return the first item, otherwise throw the correct error", () => {
    expect(listManager.getFirst()).toBe(items[0]);

    listManager.removeAll();

    expect(() => listManager.getFirst()).toThrow();

    try {
      listManager.getFirst();
    } catch (e) {
      expect(e).toBeInstanceOf(MeteorError);

      if (e instanceof MeteorError) {
        expect(e.has(EErrorId_ListManager.list_is_empty)).toBe(true);
      }
    }
  });
});
