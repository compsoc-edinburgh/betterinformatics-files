const R = require("ramda");
const fs = require("fs");
const nearley = require("nearley");
const grammar = require("./grammar");

const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
parser.feed(fs.readFileSync("./contract.txt", { encoding: "utf-8" }));
const parsed = parser.results;

console.log(JSON.stringify(parsed, null, 2));
