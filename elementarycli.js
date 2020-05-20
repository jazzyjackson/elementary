// given a filename as argument, verifies it against schema, converts to HTMLstring, runs it through prettifier
// lets you redirect to file or use as cgi, output printed to stdout
// I want to be able to run npm build-docs and convert elementaryDOM to HTML, maybe given a directory
// someday I need to parse the results of ajv errors and try to turn it into an error message that actually tells you wear to look
// maybe a least sort by most specificity?
const elementary = require('./elementary')
const beautify_html = require('js-beautify').html;
const Ajv = require('ajv')
const fs = require('fs')
const path = require('path')

let validate = new Ajv().compile(require('./schemas/schemas.json'))
let target = path.join(process.cwd(), process.argv[2]) // loads DOM from JSON, reading file

if(fs.statSync(target).isDirectory())
{
  fs.readdirSync(target)
    .filter(file => /\.elem\.json$/.test(file))
    .forEach(elementaryDOMFile =>
    {
        let name = elementaryDOMFile.slice(0, elementaryDOMFile.indexOf('.'))
        let elementaryDOM = require(path.join(target, elementaryDOMFile))

        if (validate(elementaryDOM))
        {
            fs.writeFileSync(
                path.join(target, name + '.html'),
                beautify_html(elementary(elementaryDOM))
            )
            console.log("✔️ completed " + elementaryDOMFile)
        } 
        else
        {
            console.log("❌ failed " + elementaryDOMFile)
            console.log(validate.errors.sort((a,b) => a.dataPath.length - b.dataPath.length))
            // maybe grab a temp file and write errors to a file?
        }
    }
    )
}
else
{
    let elementaryDOM = require(target)
    if (validate(elementaryDOM))
    {
        console.log(beautify_html(elementary(elementaryDOM)))
    }
    else
    {
        console.log(validate.errors)
    }
}