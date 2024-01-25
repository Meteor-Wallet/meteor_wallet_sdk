import {
  IONftConstructor_Input,
  INftWatchableProps,
  IWithBasicNftProps,
} from "./Nft.interfaces.ts";
import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces.ts";
import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity.ts";
import {
  EPubSub_WatchableProps,
  IPubSub_Watchable,
} from "../../utility/data_entity/watchable/watchable.pubsub.ts";
import { PubSub } from "../../utility/pubsub/PubSub.ts";
import { TPubSubListener } from "../../utility/pubsub/pubsub.types.ts";
import { doWatchableUpdate } from "../../utility/data_entity/editable/editable.utils.ts";
import { INftCollection } from "../../../blockchains/near/external_apis/indexer_xyz/indexer_xyz.types.ts";

export abstract class Nft implements IListManageable<IWithBasicNftProps> {
  _ord = new OrdIdentity();

  id: string;
  abstract basic: INftCollection;

  protected constructor({ id }: IONftConstructor_Input) {
    this.id = id;
  }

  /*
   *   INTERNAL INTERFACE IMPLEMENTATION THINGS
   */

  getWatchableProps(): INftWatchableProps {
    return {};
  }

  _updateWatchable(update: Partial<INftWatchableProps>) {
    doWatchableUpdate(this, update);
  }

  pubSub: PubSub<IPubSub_Watchable<INftWatchableProps>> = new PubSub<
    IPubSub_Watchable<INftWatchableProps>
  >();

  subscribe<K extends EPubSub_WatchableProps.on_update_props>(
    id: K,
    listener: TPubSubListener<IPubSub_Watchable<INftWatchableProps>[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends EPubSub_WatchableProps.on_update_props>(
    id: K,
    listener: TPubSubListener<IPubSub_Watchable<INftWatchableProps>[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: IWithBasicNftProps): boolean {
    return this.isEqualTo(other);
  }
}
