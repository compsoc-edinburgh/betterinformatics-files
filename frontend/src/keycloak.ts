import Keycloak from "keycloak-js";
const getKeycloakInstance = () => {
  const element = document.getElementById("vseth-context-data");
  if (element === null)
    throw new Error("Context data container could not be found.");
  if (!(element instanceof HTMLScriptElement))
    throw new Error("Context data container is not a script element.");
  const text = element.innerText;
  const keycloakInstanceConfig = JSON.parse(text).keycloak;
  console.log(keycloakInstanceConfig);
  const keycloak = Keycloak(keycloakInstanceConfig);
  return keycloak;
};

const keycloak = getKeycloakInstance();
export default keycloak;
