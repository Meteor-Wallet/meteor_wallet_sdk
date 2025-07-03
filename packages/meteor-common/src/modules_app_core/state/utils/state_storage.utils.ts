import _ from "lodash";
import { Store } from "pullstate";
import { IStorageKeyGetterAndSetter } from "../../../modules_utility/state_utils/EnvironmentStorageUtils";

export async function createStateStorageLink<T>(
  store: Store<any>,
  getterSetter: IStorageKeyGetterAndSetter<T>,
  objectPath: (string | number)[],
) {
  const currentValue = await getterSetter.get();

  if (currentValue != null) {
    // console.log(`state storage link: [${objectPath.join(", ")}] FOUND storage value`, currentValue);

    store.update((s) => {
      _.set(s, objectPath, currentValue);
    });
  } else {
    const memoryValue = _.get(store.getRawState(), objectPath);
    getterSetter.set(memoryValue).then(() => {});
    // console.log(`state storage link: [${objectPath.join(", ")}] NO value. Using default store value`, memoryValue);
  }

  store.subscribe(
    (s) => {
      return _.get(s, objectPath);
    },
    (val) => {
      getterSetter.set(val);
    },
  );
}
