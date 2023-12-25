import { ReactNode, isValidElement } from "react";

interface LangMap {
  en: ReactNode;
  [s: string]: ReactNode;
}

function isLangMap(obj: LangMap | {}): obj is LangMap {
  return obj.hasOwnProperty("en");
}

function getTitle(title: ReactNode | LangMap, lang: string) {
  if (title === undefined || title === null) return undefined;
  if (
    typeof title === "string" ||
    typeof title === "number" ||
    typeof title === "boolean" ||
    Array.isArray(title)
  )
    return title;
  if (isValidElement(title)) {
    return title;
  }
  if (isLangMap(title)) {
    return title[lang] ?? title.en;
  }
  return undefined;
}

/**
 *
 * @param items List of Items
 * @param lang language code (eg. "en" or "de")
 *
 * Takes an Item array and returns an Item array where every title is in the target language if possible, defaults to "en" if unavailable
 */
export function translate(items: NavItem[], lang: string): NavItem[] {
  return items.map(item => ({
    ...item,
    title: getTitle(item.title, lang),
    childItems: item.childItems
      ? translate(item.childItems, lang)
      : item.childItems,
  }));
}

export interface NavItem {
  /**
   * Title, either string or map with key: language, value: translation, please always provide english
   */
  title?: ReactNode | LangMap;

  childItems?: NavItem[];
  onClick?: () => void;
  href?: string;
}

export const globalNav: NavItem[] = [
  {
    title: "Services",
    href: undefined,
    childItems: [
      {
        title: {
          en: "Music Rooms",
          de: "Musikzimmer",
        },
        href: "https://vseth.ethz.ch/musikzimmer/",
      },
      {
        title: { de: "Bücherbörse", en: "Book market" },
        href: "https://bb.vseth.ethz.ch/frontend.php",
      },
      {
        title: { de: "Eventräume", en: "Event rooms" },
        href: "https://vseth.ethz.ch/eventraume/",
      },
      {
        title: "Polykum",
        href: "https://vseth.ethz.ch/polykum-2/",
      },
    ],
  },
  {
    title: { en: "Committees", de: "Komissionen" },
    href: undefined,

    childItems: [
      {
        title: "Challenge",
        href: "https://challenge.swiss/",
      },
      {
        title: "Debattierclub",
        href: "https://www.debattierclub.ethz.ch/",
      },
      {
        title: "ExBeerience",
        href: "https://exbeerience.ch/",
      },
      {
        title: "Filmstelle",
        href: "https://filmstelle.ch/",
      },
      {
        title: "FliK",
        href: "https://flik.ethz.ch/",
      },
      {
        title: "f&c",
        href: "https://www.polymesse.ch/",
      },
      {
        title: "Fotolabor",
        href: "https://fotolabor.ethz.ch/",
      },
      {
        title: "Kulturstelle",
        href: "https://www.kulturstelle.ch/",
      },
      {
        title: "ETH MUN",
        href: "https://ethmun.org/",
      },
      {
        title: "Nightline",
        href: "https://www.nightline.ch/",
      },
      {
        title: "Papperlapub",
        href: "https://papperlapub.ethz.ch/",
      },
      {
        title: "SSC",
        href: "https://ssc.ethz.ch/en/",
      },
      {
        title: "SPOD",
        href: "https://shop.spod.ethz.ch/",
      },
      {
        title: "TQ",
        href: "https://tanzquotient.org/",
      },
      {
        title: "GECo",
        href: "https://geco.ethz.ch/",
      },
      {
        title: "HöNK",
        href: "https://hoenk.vseth.ethz.ch/",
      },
      {
        title: "Polykum",
        href: "https://vseth.ethz.ch/language/de/polykum-2/",
      },
    ],
  },
  {
    title: { de: "Fachvereine", en: "Student associations" },
    href: undefined,
    childItems: [
      {
        title: "AIV",
        href: "http://www.aiv.ethz.ch",
      },
      {
        title: "AMIV",
        href: "https://www.amiv.ethz.ch",
      },
      {
        title: "APV",
        href: "https://www.apv.ethz.ch",
      },
      {
        title: "Architektura",
        href: "https://www.architektura.ethz.ch",
      },
      {
        title: "BSA",
        href: "https://www.bsa.ethz.ch",
      },
      {
        title: "Erfa",
        href: "http://www.erfa.ethz.ch",
      },
      {
        title: "GessWho!",
        href: "https://www.gesswho.ethz.ch",
      },
      {
        title: "GUV",
        href: "https://www.guv.ethz.ch",
      },
      {
        title: "HeaT",
        href: "https://www.heat.vseth.ethz.ch",
      },
      {
        title: "OBIS",
        href: "https://www.obis.ethz.ch",
      },
      {
        title: "SMW",
        href: "https://www.smw.ethz.ch",
      },
      {
        title: "UFO",
        href: "https://www.ufo.ethz.ch",
      },
      {
        title: "VCS",
        href: "https://www.vcs.ethz.ch",
      },
      {
        title: "VeBiS",
        href: "https://www.vebis.ch",
      },
      {
        title: "VIAL",
        href: "https://www.vial.ethz.ch",
      },
      {
        title: "VIS",
        href: "https://www.vis.ethz.ch",
      },
      {
        title: "VMP",
        href: "https://www.vmp.ethz.ch",
      },
    ],
  },
];
