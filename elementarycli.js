// given a filename as argument, verifies it against schema, converts to HTMLstring, runs it through prettifier
// lets you redirect to file or use as cgi, output printed to stdout

const Ajv = require('ajv')
const elementarySchema = require('./schemas/schemas.json')
const elementaryDOM = require(process.argv[2]) // loads DOM from JSON, reading file

const elementary = require('./elementary')

var beautify_html = require('js-beautify').html;

var ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}

ajv.validate(elementarySchema, elementaryDOM);

if (ajv.validate(elementarySchema, elementaryDOM)){
    console.log(beautify_html(elementary(elementaryDOM)))
} else {
    console.log(ajv.errors)
}