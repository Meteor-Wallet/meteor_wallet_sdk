import { IWithBasicAccount } from "../../../../core/account/account.interfaces.ts";
import { NearBasicAccount } from "../NearBasicAccount.ts";
import {
  IBasicAccountStateFeature,
  IBasicAccountStateFeatureWatchableProps,
} from "../../../../core/account/features/account_feature.state.interfaces.ts";
import { EAccountFeature } from "../../../../core/account/features/account_feature.enums.ts";
import { PubSub } from "../../../../core/utility/pubsub/PubSub.ts";
import { IPubSub_Watchable } from "../../../../core/utility/data_entity/watchable/watchable.pubsub.ts";
import { TPubSubListener } from "../../../../core/utility/pubsub/pubsub.types.ts";
import { doWatchableUpdate } from "../../../../core/utility/data_entity/editable/editable.utils.ts";
import { IStorableDataOnly } from "../../../../core/utility/data_entity/storable/storable.interfaces.ts";
import { INearAccountStateFeatureStorableData } from "../near.account_storable.interfaces.ts";

export class NearBasicAccountStateFeature
  implements IBasicAccountStateFeature, IStorableDataOnly<INearAccountStateFeatureStorableData>
{
  exists: boolean;
  pubSub: PubSub<IPubSub_Watchable<IBasicAccountStateFeatureWatchableProps>> = new PubSub();
  id: EAccountFeature.state = EAccountFeature.state;
  account: IWithBasicAccount<NearBasicAccount>;

  constructor({
    account,
    exists = false,
  }: {
    account: IWithBasicAccount<NearBasicAccount>;
    exists?: boolean;
  }) {
    this.account = account;
    this.exists = account.basic.incomingStorableData?.stateFeature.exists ?? exists;
  }

  getStorableData(): INearAccountStateFeatureStorableData {
    return {
      exists: this.exists,
    };
  }

  async checkExistence(): Promise<boolean> {
    const rpc = this.account.basic.getRpcProvider();

    const state = await rpc.viewAccount({
      account_id: this.account.basic.id,
    });

    if (state.error) {
      this._updateWatchable({
        exists: false,
      });
      return false;
    }

    this._updateWatchable({
      exists: true,
    });
    return true;
  }

  _updateWatchable(update: Partial<IBasicAccountStateFeatureWatchableProps>): void {
    doWatchableUpdate(this, update);
  }

  getWatchableProps(): IBasicAccountStateFeatureWatchableProps {
    return {
      exists: this.exists,
    };
  }

  subscribe<K extends keyof IPubSub_Watchable<IBasicAccountStateFeatureWatchableProps>>(
    id: K,
    listener: TPubSubListener<IPubSub_Watchable<IBasicAccountStateFeatureWatchableProps>[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends keyof IPubSub_Watchable<IBasicAccountStateFeatureWatchableProps>>(
    id: K,
    listener: TPubSubListener<IPubSub_Watchable<IBasicAccountStateFeatureWatchableProps>[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }
}
