const assert = require('assert')
const {elementary} = require('../elementary')

assert.strictEqual(elementary(["what a message!"]), 'what a message!')
assert.strictEqual(elementary({p: ["what a message!"]}), '<p>what a message!</p>')
assert.strictEqual(
    elementary({div: [{"p": ["what a message!"]}]}),
    '<div><p>what a message!</p></div>'
)

assert.strictEqual(
    elementary({div: [{"p": ["what a message!"]},{"!":"hello"}]}),
    '<div>' +
    '<p>what a message!</p>' +
    '<script>console.warn(JSON.parse("hello"))</script>' +
    '</div>'
)

process.env.NOSCRIPT = true
    
assert.strictEqual(
    elementary({div: [{"p": ["what a message!"]},{"!":"hello"}]}),
    '<div>' +
    '<p>what a message!</p>' +
    '<!-- "hello" -->' +
    '</div>'
)

assert.strictEqual(
    elementary({head:[{style: {body: {margin: 0, padding: 0, "box-sizing":"border-box"}}}]}),
    '<head>' +
    '<style>body {margin: 0; padding: 0; box-sizing: border-box;}</style></head>'
)

assert.strictEqual(
    elementary([
        {"!DOCTYPE html": {}},
        {html: [
            {body: [
                {h1: {
                    id: 'headline',
                    style: {color: "#222", "font-family":"sans-serif"},
                    childNodes: [
                        "hello world!"
                    ]
                }}
            ]}
        ]}
    ]),
    '<!DOCTYPE html>' +
    '<html>' +
        '<body>' +
            '<h1 id="headline" style="color: #222; font-family: sans-serif;">' + 
                'hello world!' + 
            '</h1>' + 
        '</body>' + 
    '</html>'
    // note the tabbed pretty printing is not done by elementary, it doesn't add whitespace. Your browser will pretty print it if desired.
)