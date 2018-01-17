const fs = require('fs')
const request = require('request')
const classes = require('./classes')
const UnicodeTrieBuilder = require('unicode-trie/builder')

request('http://www.unicode.org/Public/7.0.0/ucd/LineBreak.txt', function(err, res, data) {
  const matches = data.match(/^[0-9A-F]+(\.\.[0-9A-F]+)?;[A-Z][A-Z0-9]/gm)
  let start = null
  let end = null
  let type = null
  const trie = new UnicodeTrieBuilder(classes.XX)
  for (let i = 0, len = matches.length; i < len; i++) {
    let match = matches[i]
    let rangeType, rangeEnd
    match = match.split(/;|\.\./)
    let rangeStart = match[0]
    if (match.length === 3) {
      rangeEnd = match[1]
      rangeType = match[2]
    } else {
      rangeEnd = rangeStart
      rangeType = match[1]
    }
    if ((type != null) && rangeType !== type) {
      trie.setRange(parseInt(start, 16), parseInt(end, 16), classes[type], true)
      type = null
    }
    if (type == null) {
      start = rangeStart
      type = rangeType
    }
    end = rangeEnd
  }
  trie.setRange(parseInt(start, 16), parseInt(end, 16), classes[type], true)
  // fs.writeFileSync(__dirname + '/classes.trie', trie.toBuffer())
  fs.writeFileSync(__dirname + '/classes.json', '{"buf": "' + Buffer.from(trie.toBuffer()).toString('hex') + '"}')
})
