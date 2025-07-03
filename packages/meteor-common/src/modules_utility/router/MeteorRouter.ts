import { Store, registerInDevtools } from "pullstate";
import { Route } from "./Route";
import { meteor_router_defaults } from "./meteor_router_defaults";
import {
  ERouteAction,
  ERoutePathPartType,
  IMeteorRouterInitParams,
  IMeteorRouterStore,
  IRouteChangeListenerInputs,
  IRouteOptions,
  IRouteStatus,
  IRouteTreePart,
  TRoutePathPart,
} from "./meteor_router_types";

export class MeteorRouter<S> {
  private store: Store<IMeteorRouterStore<S>>;
  private routeIdOrd: number = 0;
  /*private routeStatusListeners: {
    [id: number]: (() => void)[];
  } = {};

  private routeStatusSubscribers: {
    [id: number]: (callback: () => void) => () => void;
  } = {};*/

  private routesById: {
    [id: number]: Route<any, any>;
  } = {};
  private routeTree: IRouteTreePart | undefined;

  private routeChangeListeners: ((inputs: IRouteChangeListenerInputs) => void)[] = [];

  constructor() {
    this.store = new Store<IMeteorRouterStore<S>>({
      history: [],
      currentRouteStatus: [-1, {}, -1],
    });

    registerInDevtools({
      RouterStore: this.store,
    });
  }

  addRoute<I extends object, S extends object = {}>(
    path: Array<`:${string & keyof I}` | string>,
    options?: IRouteOptions<I>,
  ): Route<I, S> {
    const routeId = this.routeIdOrd++;
    const route = new Route({ id: routeId, router: this, options, path });

    this.routesById[routeId] = route;
    this.store.update((s) => {
      s.currentRouteStatus[1][routeId] = meteor_router_defaults.defaultRouteStatus();
    });

    if (this.routeTree == null) {
      this.routeTree = {
        routeId: -1,
      };
    }

    let currentLeaf = this.routeTree!;

    // Check if is not "ROOT" route
    if (route.pathParts.length > 1) {
      for (const pathPart of route.pathParts) {
        if (pathPart.type === ERoutePathPartType.root) {
          continue;
        }

        if (pathPart.type === ERoutePathPartType.variable) {
          if (currentLeaf.var == null) {
            currentLeaf.var = {
              leaf: {
                routeId: -1,
              },
              prop: pathPart.prop,
            };
          }

          currentLeaf = currentLeaf.var.leaf;
        } else {
          if (currentLeaf.children == null) {
            currentLeaf.children = {};
          }

          if (currentLeaf.children[pathPart.text] == null) {
            currentLeaf.children[pathPart.text] = {
              routeId: -1,
            };
          }

          currentLeaf = currentLeaf.children[pathPart.text];
        }
      }
    }

    currentLeaf.routeId = routeId;

    return route;
  }

  goBack() {}

  addRouteChangeListener(listener: (inputs: IRouteChangeListenerInputs) => void): () => void {
    this.routeChangeListeners.push(listener);

    return () => {
      this.removeRouteChangeListener(listener);
    };
  }

  removeRouteChangeListener(listener: (inputs: IRouteChangeListenerInputs) => void) {
    this.routeChangeListeners.filter((l) => l !== listener);
  }

  private notifyListeners(change: IRouteChangeListenerInputs) {
    this.routeChangeListeners.forEach((listener) => listener(change));
  }

  externalGo(initParams: IMeteorRouterInitParams) {
    if (!initParams.path.startsWith("/")) {
      throw new Error(`Router: on initialization path must start with "/" `);
    }

    const path = initParams.path.slice(1);
    const pathParts: string[] = path.length > 0 ? path.split("/") : [];

    if (this.routeTree == null) {
      console.warn(`Router had no routes defined, couldn't go to path: ${initParams.path}`);
      return;
    }

    let inputs: object = {};

    if (initParams.qs != null) {
      if (typeof initParams.qs === "string") {
        inputs = Object.fromEntries(new URLSearchParams(initParams.qs));
      } else {
        inputs = initParams.qs;
      }
    }

    let currentLeaf = this.routeTree;

    let lastGoodRouteId = currentLeaf.routeId;

    for (const part of pathParts) {
      if (currentLeaf.children?.[part] != null) {
        currentLeaf = currentLeaf.children[part];
      } else if (currentLeaf.var != null) {
        inputs[currentLeaf.var.prop] = part;
        currentLeaf = currentLeaf.var.leaf;
      } else {
        break;
      }

      if (currentLeaf.routeId !== -1) {
        lastGoodRouteId = currentLeaf.routeId;
      }
    }

    if (lastGoodRouteId === -1) {
      console.warn(
        `Router couldn't resolve path in Route Tree (no routes have been set at any part of this path): ${initParams.path}`,
      );
      return;
    }

    this.executeRoutesForPathParts(this.routesById[lastGoodRouteId].pathParts, inputs);
  }

  /*useRouteStatus(routeId: number): IRouteStatus {
    return this.store.useState(s => {
      return s.history[s.history.length - 1].internal_id;
    });

    return {
      isAt: false,
      isUnder: false,
      wasAt: false,
      wasUnder: false,
    };
  }*/

  useRouteStatuses(): { [id: number]: IRouteStatus } {
    const routeStatus = this.store.useState((s) => s.currentRouteStatus);
    return routeStatus[1];
    /*return this.store.useState((s) => {
      if (s.history.length === 0) {
        return {
          wasAt: false,
          wasUnder: false,
          wasAtOrUnder: false,
          isAt: false,
          isUnder: false,
          isAtOrUnder: false,
        };
      }

      if (s.history.length === 1) {
        const nowIds = s.history[0].routeIds;
        const isAt = nowIds[nowIds.length - 1] === routeId;
        const isUnder = nowIds.some((id) => id === routeId);

        return {
          wasAt: false,
          wasUnder: false,
          wasAtOrUnder: false,
          isAt,
          isUnder,
          isAtOrUnder: isAt || isUnder,
        };
      }

      const lastIds = s.history[s.history.length - 2].routeIds;
      const nowIds = s.history[s.history.length - 1].routeIds;

      const wasAt = lastIds[lastIds.length - 1] === routeId;
      const wasUnder = lastIds.some((id) => id === routeId);
      const isAt = nowIds[nowIds.length - 1] === routeId;
      const isUnder = nowIds.some((id) => id === routeId);

      return {
        wasAt,
        wasUnder,
        wasAtOrUnder: wasAt || wasUnder,
        isAt,
        isUnder,
        isAtOrUnder: isAt || isUnder,
      };
    });*/

    /*if (this.routeStatusSubscribers[routeId] == null) {
      this.routeStatusSubscribers[routeId] = (callback) => {
        this.routeStatusListeners[routeId].push(callback);

        return () => {
          this.routeStatusListeners[routeId].filter((cb) => cb !== callback);
        };
      };
    }

    return useSyncExternalStore(this.routeStatusSubscribers[routeId], () => {
      return {
        wasAt: false,
        isAt: false,
        isUnder: false,
        wasUnder: false,
      };
    });*/
  }

  executeRoutesForPathParts(pathParts: TRoutePathPart[], inputs?: object) {
    const executionBlueprint = {};

    console.log("execute route", pathParts, inputs, this.routeTree);

    let currentLeaf = this.routeTree!;

    const routeIds: number[] = currentLeaf.routeId !== -1 ? [currentLeaf.routeId] : [];

    let hopefulPath: string = "";
    let path: string = "";

    for (const part of pathParts) {
      if (part.type === ERoutePathPartType.root) {
        continue;
      }

      if (part.type === ERoutePathPartType.text) {
        if (currentLeaf.children?.[part.text] != null) {
          currentLeaf = currentLeaf.children[part.text];
          hopefulPath = `${hopefulPath}/${part.text}`;
        }
      } else {
        if (currentLeaf.var?.prop === part.prop) {
          if (inputs?.[part.prop] != null) {
            currentLeaf = currentLeaf.var.leaf;
            hopefulPath = `${hopefulPath}/${inputs[part.prop]}`;
          } else {
            console.warn(
              `[${hopefulPath}/:${part.prop}] A parameter path part requires an input value when navigating to it- provide a value for "${part.prop}"`,
            );
          }
        }
      }

      if (currentLeaf.routeId !== -1) {
        routeIds.push(currentLeaf.routeId);
        path = hopefulPath;
      }
    }

    console.log(`route ids: ${routeIds}, path: ${path}, hopefulPath: ${hopefulPath}`);

    this.store.update((s, o) => {
      if (o.history.length > 0) {
        // Increment the edges of the route status object (for speedy equality checks)
        s.currentRouteStatus[0] = o.currentRouteStatus[0] + 1;
        s.currentRouteStatus[2] = o.currentRouteStatus[2] + 1;

        // first make all routes who "were at" in some way to not be anymore
        for (const key in o.currentRouteStatus[1]) {
          s.currentRouteStatus[1][key].wasAt = false;
          s.currentRouteStatus[1][key].wasUnder = false;
          s.currentRouteStatus[1][key].wasAtOrUnder = false;
        }

        // Get the last known route ids
        const lastRouteIds = [...o.history[o.history.length - 1].routeIds];

        // Set their new current values
        for (const routeId of lastRouteIds) {
          s.currentRouteStatus[1][routeId] = {
            ...meteor_router_defaults.defaultRouteStatus(),
            wasAtOrUnder: true,
          };
        }

        const lastAtId = lastRouteIds.pop();

        if (lastAtId) {
          s.currentRouteStatus[1][lastAtId].wasAt = true;

          for (const routeId of lastRouteIds) {
            s.currentRouteStatus[1][routeId].wasUnder = true;
          }
        }
      }

      s.history.push({
        inputs,
        routeIds,
        action: ERouteAction.push,
      });

      const nowRouteIds = [...routeIds];

      const atId = nowRouteIds.pop();

      if (atId != null) {
        s.currentRouteStatus[1][atId].isAt = true;
        s.currentRouteStatus[1][atId].isAtOrUnder = true;

        for (const routeId of nowRouteIds) {
          s.currentRouteStatus[1][routeId].isUnder = true;
          s.currentRouteStatus[1][routeId].isAtOrUnder = true;
        }
      }
    });

    this.notifyListeners({
      action: ERouteAction.push,
      inputs,
      pathParts,
      path,
    });
  }
}

/*const TestRouter = new MeteorRouter();

const Route_root = TestRouter.addRoute<{ shareId?: string }>([], {
  qs: {
    shareId: {
      type: ERoutePropType.string,
      optional: true,
    },
  },
});

const Route_wallet = Route_root.addRoute(["wallet"]);

const Route_settings = Route_root.addRoute(["settings"]);

Route_wallet.go({});*/
