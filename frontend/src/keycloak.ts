import Keycloak from "keycloak-js";

const keycloak = Keycloak({
  url: "https://auth.vseth.ethz.ch/auth",
  realm: "VSETH",
  clientId: "vis-community-solutions",
});

export default keycloak;
