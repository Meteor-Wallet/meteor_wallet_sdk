import { MeteorRouter } from "./MeteorRouter";
import {
  ERoutePathPartType,
  IRouteOptions,
  IRouteStatus,
  TRoutePathPart,
} from "./meteor_router_types";
import { meteor_router_utils } from "./meteor_router_utils";

export class Route<I extends object, S, P extends object = {}> {
  private readonly internal_id: number;
  public readonly router: MeteorRouter<any>;
  private readonly options: IRouteOptions<I>;
  public readonly pathParts: TRoutePathPart[];

  constructor(inputs: {
    router: MeteorRouter<any>;
    id: number;
    path: Array<string | `:${keyof I & string}`>;
    options?: IRouteOptions<I>;
  }) {
    this.internal_id = inputs.id;
    this.router = inputs.router;
    this.options = inputs.options ?? {
      qs: {},
    };

    this.pathParts = inputs.path.map((p) =>
      p.startsWith(":")
        ? {
            type: ERoutePathPartType.variable,
            prop: p.slice(1),
          }
        : { type: ERoutePathPartType.text, text: p },
    );

    if (inputs.options?.parent != null) {
      this.pathParts = [...inputs.options.parent.pathParts, ...this.pathParts];
    }

    if (this.pathParts.length === 0 || this.pathParts[0].type !== ERoutePathPartType.root) {
      this.pathParts = [
        {
          type: ERoutePathPartType.root,
        },
        ...this.pathParts,
      ];
    }
  }

  go(inputs?: I & Partial<P>) {
    /*if (this.options.parent != null) {
      this.options.parent.go(inputs);
    }*/

    console.warn(`Not checking inputs for route: ${meteor_router_utils.prettyPrintRoute(this)}`);

    this.router.executeRoutesForPathParts(this.pathParts, inputs);
  }

  addRoute<NI extends object, NS extends object = {}>(
    path: Array<string | `:${keyof NI & string}`>,
    options?: Omit<IRouteOptions<NI>, "parent">,
  ): Route<NI, NS, I> {
    return this.router.addRoute(path, { ...options, parent: this });
  }

  useStatus(): IRouteStatus {
    return this.router.useRouteStatuses()[this.internal_id];
  }

  get id(): number {
    return this.internal_id;
  }
}
