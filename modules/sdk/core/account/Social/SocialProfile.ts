import { doWatchableUpdate } from "../../utility/data_entity/editable/editable.utils.ts";
import {
  EPubSub_WatchableProps,
  IPubSub_Watchable,
} from "../../utility/data_entity/watchable/watchable.pubsub.ts";
import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity.ts";
import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces.ts";
import { PubSub } from "../../utility/pubsub/PubSub.ts";
import { TPubSubListener } from "../../utility/pubsub/pubsub.types.ts";
import {
  IOSocialConstructor_Input,
  ISocialProfile,
  ISocialWatchableProps,
  IWithBasicSocialProps,
} from "./Social.interfaces.ts";

export abstract class SocialProfile implements IListManageable<IWithBasicSocialProps> {
  _ord = new OrdIdentity();

  id: string;
  abstract socialProfile?: ISocialProfile;
  abstract hasTosToAccept: boolean;

  protected constructor({ id }: IOSocialConstructor_Input) {
    this.id = id;
  }

  /*
   *   INTERNAL INTERFACE IMPLEMENTATION THINGS
   */

  getWatchableProps(): ISocialWatchableProps {
    return {};
  }

  _updateWatchable(update: Partial<ISocialWatchableProps>) {
    doWatchableUpdate(this, update);
  }

  pubSub: PubSub<IPubSub_Watchable<ISocialWatchableProps>> = new PubSub<
    IPubSub_Watchable<ISocialWatchableProps>
  >();

  subscribe<K extends EPubSub_WatchableProps.on_update_props>(
    id: K,
    listener: TPubSubListener<IPubSub_Watchable<ISocialWatchableProps>[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends EPubSub_WatchableProps.on_update_props>(
    id: K,
    listener: TPubSubListener<IPubSub_Watchable<ISocialWatchableProps>[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  isEqualTo(other: IWithBasicSocialProps): boolean {
    return this.isEqualTo(other);
  }
}
