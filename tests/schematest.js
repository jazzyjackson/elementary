
const Ajv = require('ajv')
const assert = require('assert')
let validate = new Ajv().compile(require('../schemas/schemas.json'))


//it should reject a DOM where you forgot to wrap a text node in brackets
//the value of a tagName must be an array of childnodes or an object of html attributes
assert.strictEqual(validate(
    {"body":[
        {"h1": "Lookalive Elementary"},
        {"p": ["TODO: instructions for using Elementary"]}
    ]}
), false)
// wrapping the header text in brackets should fix it
assert.strictEqual(validate(
    {"body":[
        {"h1": ["Lookalive Elementary"]},
        {"p": ["TODO: instructions for using Elementary"]}
    ]}
), true)