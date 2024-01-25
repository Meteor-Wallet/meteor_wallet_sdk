import {
  IRequestInstruction,
  IRequestProperty,
  IRpcEndpointDefinition,
  IUniqueRpcEndpointProps,
} from "./blockchain_network.interfaces";
import { BlockchainNetwork } from "./BlockchainNetwork";
import { IListManageable } from "../../utility/managers/list_manager/list_manager.interfaces";
import { OrdIdentity } from "../../utility/managers/list_manager/OrdIdentity";
import { ISubscribable } from "../../utility/pubsub/pubsub.interfaces.ts";
import { EPubSub_RpcEndpoint, IPubSub_RpcEndpoint } from "./RpcEndpoint.pubsub.ts";
import { PubSub } from "../../utility/pubsub/PubSub.ts";
import { TPubSubListener } from "../../utility/pubsub/pubsub.types.ts";
import { IEditableAndWatchableProps } from "../../utility/data_entity/editable/editable.interfaces.ts";
import { IRpcEndpointEditableProps } from "./RpcEndpoint.interfaces.ts";
import { doWatchableUpdate } from "../../utility/data_entity/editable/editable.utils.ts";

export class RpcEndpoint
  implements
    IListManageable<IUniqueRpcEndpointProps>,
    IRpcEndpointDefinition,
    ISubscribable<IPubSub_RpcEndpoint>,
    IEditableAndWatchableProps<IRpcEndpointEditableProps>
{
  pubSub: PubSub<IPubSub_RpcEndpoint> = new PubSub<IPubSub_RpcEndpoint>();

  _ord = new OrdIdentity();
  network: BlockchainNetwork;
  isEnabled: boolean;
  isUserCreated: boolean;
  isArchival: boolean;
  requestInstruction: IRequestInstruction;
  properties?: IRequestProperty[];
  label?: string;

  constructor({
    network,
    isEnabled,
    isUserCreated,
    requestInstruction,
    properties,
    isArchival,
    label,
  }: IRpcEndpointDefinition & { network: BlockchainNetwork }) {
    this.network = network;
    this.isEnabled = isEnabled;
    this.isUserCreated = isUserCreated;
    this.requestInstruction = requestInstruction;
    this.properties = properties;
    this.isArchival = isArchival;
    this.label = label;
  }

  _updateWatchable(update: Partial<IRpcEndpointEditableProps>) {
    this.updateEditable(update);
  }

  getRuntimeUniqueKey(): string | number {
    return this._ord.getOrd();
  }

  getEditableProps(): IRpcEndpointEditableProps {
    return {
      requestInstruction: this.requestInstruction,
      properties: this.properties,
      isEnabled: this.isEnabled,
    };
  }

  getWatchableProps(): IRpcEndpointEditableProps {
    return this.getEditableProps();
  }

  updateEditable(props: Partial<IRpcEndpointEditableProps>) {
    doWatchableUpdate(this, props, {
      properties: true,
      requestInstruction: true,
    });
  }

  subscribe<K extends keyof IPubSub_RpcEndpoint>(
    id: K,
    listener: TPubSubListener<IPubSub_RpcEndpoint[K]>,
  ): () => void {
    return this.pubSub.subscribe(id, listener);
  }

  unsubscribe<K extends keyof IPubSub_RpcEndpoint>(
    id: K,
    listener: TPubSubListener<IPubSub_RpcEndpoint[K]>,
  ): void {
    return this.pubSub.unsubscribe(id, listener);
  }

  isEqualTo(other: IUniqueRpcEndpointProps): boolean {
    return other.requestInstruction.url === this.requestInstruction.url;
  }
}
