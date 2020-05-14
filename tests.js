const assert = require('assert')
const dispatch = require('./elementary')

assert.strictEqual(dispatch(["what a message!"]), 'what a message!')
assert.strictEqual(dispatch({p: ["what a message!"]}), '\n<p>what a message!</p>')
assert.strictEqual(
    dispatch({div: [{"p": ["what a message!"]}]}),
    '\n<div>\n<p>what a message!</p></div>'
)

assert.strictEqual(
    dispatch({div: [{"p": ["what a message!"]},{"!":"hello"}]}),
    '\n' +
    '<div>\n' +
    '<p>what a message!</p>\n' +
    '<script>console.warn(JSON.parse("hello"))</script>' +
    '</div>'
)

process.env.NOSCRIPT = true
    
assert.strictEqual(
    dispatch({div: [{"p": ["what a message!"]},{"!":"hello"}]}),
    '\n' +
    '<div>\n' +
    '<p>what a message!</p>\n' +
    '<!-- "hello" -->\n' +
    '</div>'
)

assert.strictEqual(
    dispatch({head:[{style: {body: {margin: 0, padding: 0, "box-sizing":"border-box"}}}]}),
    '\n' +
    '<head>\n' +
    '<style>body {margin: 0; padding: 0; box-sizing: border-box;}</style></head>'
)

assert.strictEqual(
    dispatch([
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
    '\n' +
    '<!DOCTYPE html>\n' +
    '<html>\n' +
        '<body>\n' +
            '<h1 id="headline" style="color: #222; font-family: sans-serif;">' + 
                'hello world!' + 
            '</h1>' + 
        '</body>' + 
    '</html>'
    // note the tabbed pretty printing is not done by dispatch, it doesn't add whitespace. Your browser will pretty print it if desired.
)