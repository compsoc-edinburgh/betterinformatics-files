import * as React from "react";
import {
  Container
} from "@mantine/core";
import classes from "./TopHeader.module.css";
import type { MantineSize } from "@mantine/core";

import { globalNav, translate, NavItem } from "./GlobalNav";
import ExternalNavElement from "./ExternalNav";
import ColorSchemeToggle from "../color-scheme-toggle";

interface Props {
  selectedLanguage: "en" | "de" | string;
  languages?: { key: string; label: string }[];
  onLanguageSelect: (language: string) => void;
  organizationNav?: NavItem[];
  logo: string | undefined;
  size: MantineSize | undefined;
}

const TopHeader: React.FC<Props> = ({
  selectedLanguage,
  languages,
  organizationNav,
  logo,
  onLanguageSelect,
  size,
}) => {
  return (
    <Container
      visibleFrom="md"
      className={classes.navbar}
      fluid={true}
      style={{ backgroundColor: "var(--mantine-color-dark-6)" }}
    >
      <Container size={size ? size : "xl"} className={classes.container}>
        <img
          src={
            logo
              ? logo
              : "https://static.vseth.ethz.ch/assets/vseth-0000-vseth/logo-mono.svg"
          }
          className={classes.logo}
          alt="Logo of the student organization"
        />
        <div className={classes.items}>
          {translate(
            organizationNav ? organizationNav : globalNav,
            selectedLanguage,
          ).map((item, i) => (
            <ExternalNavElement
              item={item}
              mobile={false}
              key={i}
              isExternal={true}
            />
          ))}
          {languages ? (
            <ExternalNavElement
              item={{
                title: selectedLanguage,
                childItems: languages.map(lang => {
                  return {
                    title: lang.label,
                    onClick: () => onLanguageSelect(lang.key),
                  };
                }),
              }}
              mobile={false}
              isExternal={true}
            />
          ) : undefined}
          <ColorSchemeToggle/>
        </div>
      </Container>
    </Container>
  );
};

export default TopHeader;
