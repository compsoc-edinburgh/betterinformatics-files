const R = require("ramda");
const { lowerFirst } = require("lodash");

module.exports = function renderTS(rpcs, types) {
  const parts = [
    "class ApiClient {",
    rpcs.map(renderTSRpc),
    "}",
    types.map(renderTSType)
  ];
  return R.flatten(parts).join("\n\n");
};

function toTSType(e) {
  const typeMap = {
    int32: "number",
    bool: "boolean",
    Timestamp: "Date"
  };
  const name = typeMap[e.name] || e.name;
  return e.array ? `${name}[]` : name;
}

function renderTSType(e) {
  return `
interface ${e.name} {
  ${e.fields
    .map(f => `${toTSType(f.type)} ${f.name};`)
    .map(R.trim)
    .join("\n")}
}
  `;
}

function renderTSRpc(e) {
  return `
${lowerFirst(e.name)} (req: ${toTSType(e.req)}): Promise<${toTSType(e.res)}> {
  return Promise.reject("not implemented")
}
  `;
}
