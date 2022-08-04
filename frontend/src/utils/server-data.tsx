interface IServerData {
  title_prefix: string;
  title_suffix: string;
  email_address: string;
  imprint: string;
  privacy_policy: string;
  unlock_deposit_notice: string;
}
const getServerData = () => {
  const element = document.getElementById("server-data");
  if (element === null)
    throw new Error("Server data container could not be found.");
  if (!(element instanceof HTMLScriptElement))
    throw new Error("Server data container is not a script element.");
  const text = element.innerText;
  const data = JSON.parse(text);
  return data as IServerData;
};

const serverData = getServerData();
export default serverData;
