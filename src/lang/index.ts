import en from "./en";
import zhCN from "./zh-CN";
import zhHant from "./zh-Hant";
import nbNO from "./nb-NO";
import ptBR from "./pt-BR";
import ptPT from "./pt-PT";
import fr from "./fr";
import de from "./de";
import af from "./af";
import es from "./es";
import ru from "./ru";
import ja from "./ja";
import tr from "./tr";
import it from "./it";
import ko from "./ko";


const langs = {
  ko,
  it,
  tr,
  ja,
  ru,
  es,
  af,
  de,
  fr,
  en,
  "zh-CN": zhCN,
  "zh-Hant": zhHant,
  "nb-NO": nbNO,
  "pt-BR": ptBR,
  "pt-PT": ptPT,
};

export const Lang = typeof langs["en"];

export const englishLanguage = "English";
const languageMapping: {[key: string]: string} = {
  [englishLanguage]: "en",
  Français: "fr",
  Deutsch: "de",
  简体中文: "zh-CN",
  繁體中文: "zh-Hant",
  Afrikaans: "af",
  Español: "es",
  "Norsk (bokmål)": "nb-NO",
  "Português (Brasileiro)": "pt-BR",
  "Português (Europeu)": "pt-PT",
  Русский: "ru",
  日本語: "ja",
  Italiano: "it",
  Türkçe: "tr",
  한국어: "ko",
};
export const availableLanguages = Object.keys(languageMapping);


export default function getLangFunc(defaultLanguage: string) {
  return (language: any): Lang => {
    if (Object.values(langs).includes(language)) {
      return language;
    }

    let lang = language;
    const availableLangs = Object.keys(langs);

    if (availableLangs.includes(languageMapping[lang])) {
      lang = languageMapping[lang];
    }

    if (!availableLangs.includes(lang)) {
      lang = languageMapping[defaultLanguage];
    }

    lang = lang || englishLanguage;

    const langObj = langs[lang as keyof typeof langs];
    langObj.label = lang;
    return langObj;
  }
}


function test_getLang() {
  const defaultLanguage = 'Français';
  const func = getLangFunc(defaultLanguage);

  let count = 1;
  const assert = (arg, expected, notEquals=false) => {
    let aTest = func(arg) === expected;
    if (notEquals) {
      aTest = !aTest;
    }

    if (!aTest) {
      arg = JSON.stringify(arg);
      expected = JSON.stringify(expected);
      const operation = notEquals ? "===" : "!==";

      throw new Error(
        `Assertion #${count} fails: ${arg} ${operation} ${expected}`
      );
    }

    count++;
  };


  const langEn = langs["en"];
  const langDefault = langs[languageMapping[defaultLanguage]];

  assert(null, langDefault);
  assert(null, langs["af"], true);
  assert(false, langDefault);
  assert("", langDefault);

  assert("not a lang", langDefault);

  assert("en", langEn);
  assert("English", langEn);

  assert("fr", langs["fr"]);
  assert("Français", langs["fr"]);

  assert(langEn, langEn);

  assert(englishLanguage, langEn);
}
