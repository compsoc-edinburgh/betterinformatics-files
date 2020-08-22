import Keycloak from "keycloak-js";
// TODO: Read config from server
const keycloak = Keycloak({
  url: "https://auth.vseth.ethz.ch/auth",
  realm: "VSETH",
  clientId: "vis-community-solutions",
});

export default keycloak;
