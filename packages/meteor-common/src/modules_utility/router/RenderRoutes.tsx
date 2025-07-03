import React from "react";
import { Route } from "./Route";
import { IRouteStatus } from "./meteor_router_types";

type TCPRender = {
  route: Route<any, any>;
  children: React.ReactElement;
  _withKnownStatus?: IRouteStatus;
} & (
  | {
      at?: true;
      under?: undefined;
    }
  | {
      at?: undefined;
      under?: true;
    }
);

export const Render: React.FC<TCPRender> = ({
  children,
  route,
  at = false,
  under = false,
  _withKnownStatus,
}) => {
  const status = _withKnownStatus ?? route.useStatus();

  if (status.isAtOrUnder && !at && !under) {
    return children;
  }

  if (status.isAt && at) {
    return children;
  }

  if (status.isUnder && under) {
    return children;
  }

  return <></>;
};

interface ICPOneOf {
  children: React.ReactElement<TCPRender>[] | React.ReactElement<TCPRender>;
}

export const OneOf: React.FC<ICPOneOf> = ({ children }): React.ReactElement => {
  if (children == null) {
    return <></>;
  }

  const chosenChildren: React.ReactElement<TCPRender>[] = !Array.isArray(children)
    ? [children as React.ReactElement<TCPRender>]
    : (children as React.ReactElement<TCPRender>[]);

  const router = chosenChildren[0].props.route.router;

  const routeStatuses = router.useRouteStatuses();

  for (const child of chosenChildren) {
    const { props } = child;
    const childStatus = routeStatuses[props.route.id];
    const newChild = React.cloneElement(child, {
      _withKnownStatus: childStatus,
    });

    if (props.under == null && props.at == null && childStatus.isAtOrUnder) {
      return newChild;
    }

    if (childStatus.isAt && props.at) {
      return newChild;
    }

    if (childStatus.isUnder && props.under) {
      return newChild;
    }
  }

  return <></>;
};

type TMatchOneRouteItem = [route: Route<any, any>, element: React.ReactElement];

export function renderOne(routeItems: TMatchOneRouteItem[]): React.ReactElement {
  return <></>;
}
