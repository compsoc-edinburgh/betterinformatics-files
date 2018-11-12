const R = require("ramda");
const fs = require("fs");
const nearley = require("nearley");
const grammar = require("./grammar");
const renderTS = require("./render-ts");

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
parser.feed(fs.readFileSync("./contract.txt", {encoding: "utf-8"}));
const parsed = parser.results[0] || [];

const {rpc: rpcs, type: types} = R.groupBy(R.prop("kind"), parsed);

console.log(renderTS(rpcs, types));
