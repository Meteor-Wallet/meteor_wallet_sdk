import { ReactNode } from "react";
import ReactDOMServer from "react-dom/server";
import { ErrorBoundary } from "react-error-boundary";
import { AppStore } from "../state/app_store/AppStore";
import { ELanguage } from "./translation_types";
import { translations } from "./translations";
import { useLang } from "./useLang";

export const getLocaleMonth = (date: Date, languageCode: string) => {
  date = new Date(date);
  const isInAYear = () => {
    const now = new Date();
    return now.getFullYear() == date.getFullYear() || now.getMonth() < date.getMonth();
  };
  return date.toLocaleDateString(languageCode, {
    year: isInAYear() ? undefined : "numeric",
    month: "long",
  });
};

export const getDateFormattedToLocale = (date: Date) => {
  const { languageCode } = useLang();
  date = new Date(date);
  const isThisYear = () => {
    const now = new Date();
    return now.getFullYear() === date.getFullYear();
  };
  return date.toLocaleDateString(languageCode, {
    year: isThisYear() ? undefined : "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const getLangCode = () => {
  return AppStore.getRawState().language;
};

export const getLang = () => {
  return translations[getLangCode()];
};

const I18N_TAG = "i18n:";

export const parseI18n = (key: string, langCode?: ELanguage) => {
  if (!key) {
    return null;
  }
  const useLangCode: ELanguage = langCode ?? getLangCode();
  const eatHead = (str: string, head: string) =>
    str.startsWith(head) ? str.slice(head.length) : str;
  if (!key.toLowerCase().startsWith(I18N_TAG)) {
    return null;
  }
  key = key.slice(I18N_TAG.length).trim();
  key = eatHead(key, "lang.");
  const routes = key.split(".");
  const routeIn = (routes: string[], obj: any) => {
    if (!obj) {
      return null;
    }
    const [now, ...rest] = routes;
    if (!now) {
      return obj;
    }
    return routeIn(rest, obj[now]);
  };
  const isValid = (obj: unknown): obj is string => typeof obj === "string";
  const nowLangTree = translations[useLangCode];
  const nowLang = routeIn(routes, nowLangTree);
  if (isValid(nowLang)) {
    return nowLang;
  }
  const defaultLangTree = translations[ELanguage.en];
  const defaultLang = routeIn(routes, defaultLangTree);
  if (isValid(defaultLang)) {
    console.log(
      "cannot find translation for",
      key,
      "in langCode",
      useLangCode,
      "use default(EN) instead",
    );
    return defaultLang;
  }

  console.warn("cannot find translation for", key);
  return null;
};

export const tryParseI18n = (str?: string, langCode?: ELanguage) => {
  if (!str) {
    return str;
  }
  return parseI18n(str, langCode) ?? str;
};

export type TInjectedObject = { [key: string]: ReactNode };

/**
 * You can use locale string as follow:
 * "this is an i18 {0} string for {1}", data: [<Icon />, "user"],
 * "this is an i18 {icon} string for {user}", data: {icon: <Icon />, user: "user"},
 *
 * For conditional:
 * > "this is an i18: {hasValue?: The Value is \{hasValue\} }",
 * >  shown with: data: {hasValue: 123}
 * >  not shown with: data: {hasValue: null}, or data: {hasValue: false}, or data: {hasValue: undefined},
 * @param localeText
 * @param data
 * @returns
 */
export const TranslateParser: React.FC<{
  localeText: string;
  data: TInjectedObject | ReactNode[];
}> = ({ localeText, data }) => {
  const keys: string[] = [];
  const reg = /\{((?:[0-9a-zA-Z_]|\s|(?:\\{)|(?:\\}))*)\}/g;
  const regSplit = /\{(?:[0-9a-zA-Z_]|\s|(?:\\{)|(?:\\}))*\}/;

  while (true) {
    const result = reg.exec(localeText);
    if (!result) {
      break;
    }
    keys.push(result[1]);
  }

  const localeArr = localeText.split(regSplit);
  return localeArr.reduce(
    (p, v, i, arr) => {
      // skip the first
      if (!i) {
        return <>{v}</>;
      }
      let key = keys[i - 1];
      const getInjected = () => {
        // return <>111</>
        if (Array.isArray(data)) {
          const i = parseInt(key);
          return data[i - 1];
        }
        const matchCondition = key.match(/^([0-9a-zA-Z_]+)\?:(.+)$/);
        if (matchCondition) {
          const [all, conditionKey, subLocalText] = matchCondition;
          if (
            data[conditionKey] === undefined ||
            data[conditionKey] === null ||
            data[conditionKey] === false
          ) {
            return <></>;
          }
          const rawLocalText = subLocalText.replaceAll(/\\\{/, "{").replaceAll(/\\\}/, "}").trim();
          return <TranslateParser data={data} localeText={rawLocalText} />;
        }
        if (data[key] === undefined) {
          throw new Error(`translate error: unable to find key "${key}" in "data" arg`);
        }
        return data[key];
      };

      const injected = getInjected();
      return (
        <ErrorBoundary fallback={<></>}>
          {p}
          {injected}
          {v}
        </ErrorBoundary>
      );
    },
    <></>,
  );
};

export const TranslateParserV2 = ({
  localeText: locale,
  data,
}: {
  localeText: string;
  data?: {
    [key: string]: string | React.ReactElement;
  };
}) => {
  const converted: { [key: string]: string } = {};

  Object.entries(data || {}).map(([key, val]) => {
    if (typeof val === "string") {
      converted[key] = val;
    } else {
      converted[key] = ReactDOMServer.renderToString(val);
    }
  });

  let finalString = locale;

  try {
    Object.entries(converted).map(([key, value]) => {
      finalString = finalString.replaceAll(`{${key}}`, value);
    });
  } catch (err) {
    console.log(err, "TranslateParserV2 Error");
    finalString = locale;
  }

  return (
    <ErrorBoundary fallbackRender={() => <span>{locale}</span>}>
      <span
        dangerouslySetInnerHTML={{
          __html: finalString,
        }}
      />
    </ErrorBoundary>
  );
};
