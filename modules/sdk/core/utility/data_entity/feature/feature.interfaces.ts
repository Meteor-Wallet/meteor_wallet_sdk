export type TFeatureMapWithSupport<F extends { [key in string]: any }> = {
  [key in string]: { feature?: F[key]; supported: boolean };
};

export interface IWithAnyFeatures<F extends { [key in string]: any } = any> {
  getFeature: <E extends keyof F>(featureId: E) => F[E];
  supportsFeature: <E extends keyof F>(featureId: E) => boolean;
  features: Partial<TFeatureMapWithSupport<F>>;
  initializeFeature: <E extends string>(featureId: E) => F[E] | undefined;
}
