import { MeteorError } from "../../../errors/MeteorError.ts";
import { IWithAnyFeatures } from "./feature.interfaces.ts";

export function getFeature<
  E extends string,
  K extends {
    [key in string]: any;
  },
>(
  withFeatures: IWithAnyFeatures<K>,
  featureId: E,
  createError: (featureId: E) => MeteorError,
): K[E] {
  if (!withFeatures.features[featureId]) {
    tryInitializeFeature(withFeatures, featureId, createError);
  }

  return withFeatures.features[featureId]!.feature as K[E];
}

function tryInitializeFeature<
  E extends string,
  K extends {
    [key in string]: any;
  },
>(
  withFeatures: IWithAnyFeatures<K>,
  featureId: E,
  createError: (featureId: E) => MeteorError,
): void {
  const feature = withFeatures.initializeFeature(featureId);

  if (feature == null) {
    withFeatures.features[featureId] = {
      supported: false,
    };

    throw createError(featureId);
  }

  withFeatures.features[featureId] = {
    feature,
    supported: true,
  };
}

export function supportsFeature<
  E extends string,
  K extends {
    [key in E]: any;
  },
>(
  withFeatures: IWithAnyFeatures<K>,
  featureId: E,
  createError: (featureId: E) => MeteorError,
): boolean {
  const featureWithSupport = withFeatures.features[featureId];

  if (featureWithSupport == null) {
    tryInitializeFeature(withFeatures, featureId, createError);
  }

  return withFeatures.features[featureId]!.supported;
}
