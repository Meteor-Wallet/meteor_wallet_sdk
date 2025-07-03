import { Route } from "./Route";

export enum ERouteAction {
  pop = "pop",
  push = "push",
}

interface IMeteorRouteData<S> {
  routeIds: number[];
  inputs?: object;
  action: ERouteAction;
}

export interface IMeteorRouterStore<S> {
  history: IMeteorRouteData<S>[];
  currentRouteStatus: [
    number,
    {
      [id: number]: IRouteStatus;
    },
    number,
  ];
}

export enum ERoutePropType {
  string = "string",
  number = "number",
  boolean = "boolean",
}

export interface IRouteQueryStringTypeDefinition<T> {
  type: T extends string | undefined
    ? ERoutePropType.string
    : T extends boolean | undefined
      ? ERoutePropType.boolean
      : ERoutePropType.number;
  optional?: boolean;
  exact?: boolean;
}

export interface IRouteOptions<I> {
  qs?: {
    [key in keyof I]?: true | IRouteQueryStringTypeDefinition<key>;
  };
  parent?: Route<any, any>;
}

export enum ERoutePathPartType {
  root = 0,
  text = 1,
  variable = 2,
}

export type TRoutePathPart =
  | {
      type: ERoutePathPartType.root;
      prop?: undefined;
      text?: undefined;
    }
  | {
      type: ERoutePathPartType.variable;
      prop: string;
      text?: undefined;
    }
  | {
      type: ERoutePathPartType.text;
      prop?: undefined;
      text: string;
    };

export interface IRouteTreePart {
  var?: {
    prop: string;
    leaf: IRouteTreePart;
  };
  children?: {
    [pathPart: string]: IRouteTreePart;
  };
  routeId: number;
}

export interface IRouteStatus {
  isAt: boolean;
  isUnder: boolean;
  isAtOrUnder: boolean;
  wasAt: boolean;
  wasUnder: boolean;
  wasAtOrUnder: boolean;
}

export interface IMeteorRouterInitParams {
  path: string;
  qs?: object | string;
}

export interface IRouteChangeListenerInputs {
  action: ERouteAction;
  path: string;
  pathParts: TRoutePathPart[];
  inputs?: object;
  qsObject?: object;
  qs?: string;
}
