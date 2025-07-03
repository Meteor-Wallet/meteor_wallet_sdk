import { addDays } from "date-fns";
import {
  ApiPlugin_CloudFunctionSessionCookie,
  IApiPlugin_CloudFunctionSessionCookie_ContextualMethods,
} from "./ApiPlugin_CloudFunctionSessionCookie";

ApiPlugin_CloudFunctionSessionCookie.implementContextualStateInitializer(
  ({ plugins: { cookies } }) => {
    const session = cookies.getVar({ key: "__session", opt: { signed: true } });

    return {
      session: session ?? {
        ord: 0,
      },
    };
  },
);

ApiPlugin_CloudFunctionSessionCookie.implementContextual(
  async ({ plugins: { cookies }, store }) => {
    store.addWatcher(
      (s) => s.session,
      (sessionObject) => {
        cookies.setVar({
          key: "__session",
          value: sessionObject,
          opt: { signed: true, expires: addDays(new Date(), 7) },
        });
      },
    );

    const setVar: IApiPlugin_CloudFunctionSessionCookie_ContextualMethods["setVar"] = ({
      key,
      value,
    }) => {
      store.update((s) => {
        s.session[key] = value;
      });
    };

    const extendSession: IApiPlugin_CloudFunctionSessionCookie_ContextualMethods["extendSession"] =
      () => {
        store.update((s, o) => {
          s.session.ord = (o.session.ord ?? 0) + 1;
        });
      };

    const getVar: IApiPlugin_CloudFunctionSessionCookie_ContextualMethods["getVar"] = ({ key }) => {
      return store.current.session[key];
    };

    const clear: IApiPlugin_CloudFunctionSessionCookie_ContextualMethods["clear"] = ({ key }) => {
      store.update((s) => {
        s.session[key] = undefined;
      });
    };

    const clearAll: IApiPlugin_CloudFunctionSessionCookie_ContextualMethods["clearAll"] = () => {
      store.update((s) => {
        s.session = {};
      });

      cookies.clear({ key: "__session", opt: { signed: true } });
    };

    return {
      methods: {
        setVar,
        getVar,
        extendSession,
        clear,
        clearAll,
      },
    };
  },
);

export const ApiPlugin_CloudFunctionSessionCookie_Impl = ApiPlugin_CloudFunctionSessionCookie;
