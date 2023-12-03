import { NavItem } from "./GlobalNav";

export const _defaultCopyright = "Copyright 2023 VSETH ";

export const _defaultPrivacyPolicy =
  "https://account.vseth.ethz.ch/legal/privacy";

export const _defaultImpressum = "https://account.vseth.ethz.ch/impressum";

export const _mobileWidth = "43.75rem";

export const COLORS = {
  CYAN: "#009FE3",
  RED: "#F03A47",
  DARKRED: "#AF5B5B",
  DARKBLUE: "#183059",
};

export interface ConfigOptions {
  logo: string;
  signet: string;
  primaryColor: string;
  privacy: string;
  disclaimer: string;
  copyright: string;
  socialMedia: {
    type: "facebook" | "twitter" | "instagram" | "email";
    link: string;
  }[];
  languages: { key: string; label: string }[];
  externalNav: NavItem[];
}

export const defaultConfigOptions = {
  logo: "https://static.vseth.ethz.ch/assets/vseth-0000-vseth/logo-mono.svg",
  primaryColor: "#009FE3",
  disclaimer: "https://account.vseth.ethz.ch/impressum",
  privacy: "https://account.vseth.ethz.ch/legal/privacy",
  copyright: "Copyright 2023 VSETH",
  languages: [
    { key: "en", label: "English" },
    { key: "de", label: "Deutsch" },
  ],
  externalNav: [
    {
      title: "Services",
      childItems: [
        {
          title: {
            en: "Music Rooms",
            de: "Musikzimmer",
          },
          href: "https://vseth.ethz.ch/musikzimmer/",
        },
        {
          title: {
            de: "BÃ¼cherbÃ¶rse",
            en: "Book market",
          },
          href: "https://bb.vseth.ethz.ch/frontend.php",
        },
        {
          title: {
            de: "EventrÃ¤ume",
            en: "Event rooms",
          },
          href: "https://stuz.vseth.ethz.ch/",
        },
        {
          title: "Polykum",
          href: "https://vseth.ethz.ch/polykum-2/",
        },
      ],
    },
    {
      title: {
        en: "Committees",
        de: "Komissionen",
      },
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
          title: "Fotokommission",
          href: "https://www.fotokommission.ch/",
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
          title: "Polykum",
          href: "https://vseth.ethz.ch/language/de/polykum-2/",
        },
        {
          title: "SEK",
          href: "https://sek.vseth.ethz.ch/",
        },
      ],
    },
    {
      title: {
        de: "Fachvereine",
        en: "Student associations",
      },
      childItems: [
        {
          title: "AIV",
          href: "https://www.aiv.ethz.ch",
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
          href: "https://www.erfa.ethz.ch",
        },
        {
          title: "GessWho!",
          href: "https://www.gesswho.ethz.ch",
        },
        {
          title: "GESO",
          href: "https://www.geso.ethz.ch",
        },
        {
          title: "HeaT",
          href: "https://www.heat.ethz.ch",
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
  ],
  socialMedia: [
    { type: "instagram", link: "https://www.instagram.com/vsethz" },
    { type: "email", link: "mailto:vseth@vseth.ethz.ch" },
  ],
} as ConfigOptions;
