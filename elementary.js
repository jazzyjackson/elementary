const Type = require('@lookalive/type')
const empty_elements = [
    "!DOCTYPE html",
    "area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"
]
/**
 * @param {object | array} template the source template in the form {tagname: {attrs}} or list thereof
 * @returns {string} the fully assembled HTML
 */
module.exports = dispatch

function dispatch(template){
    switch(Type.from(template).identity){
        case Array:
            return template.map(dispatch).join('')
        case Object:
            return Object.entries(template).shift().shift() // dig into the tagname of {tagname:{}}
                .match(/^style$/i)
                    ? makeStyleNode(template)
                    : makeElementNode(template)
        default:
            return String(template)
    }
}

function makeStyleNode(template){
    let CSSSelectorSets = Object.entries(template).pop().pop()
    return interpolate('style', [makeCSSSelectorSet(CSSSelectorSets)])
}

function makeElementNode(template){
    let [[tagName, attributePairs]] = Object.entries(template)

    if(tagName == '!'){
        return process.env.NOSCRIPT
            ? `\n<!-- ${JSON.stringify(attributePairs)} -->\n`
            : dispatch({script:[`console.warn(JSON.parse(${JSON.stringify(attributePairs)}))`]})
    } else if(Type.isArray(attributePairs)){
        // Arrays are used to skip attributes on the outerhtml and give child nodes directly, text nodes are no problem.
        return interpolate(tagName, dispatch(attributePairs))
    } else {
        let innerHTML = new Array
        let outerHTML = new Array

        for(var [attributeName, attributeValue] of Object.entries(attributePairs)){
            switch(attributeName.toLowerCase()){
                case 'childnodes':
                    innerHTML.push(dispatch(attributeValue)) // dispatch joins arrays into strings after mapping
                    break
                case 'style':
                    attributeValue = makeCSSRuleValuePairs(attributeValue)
                    outerHTML.push(makeHTMLAttribute(attributeName, attributeValue))
                    break
                default:
                    outerHTML.push(makeHTMLAttribute(attributeName, attributeValue))
             }
        }
        
        return interpolate(tagName, innerHTML, outerHTML)
    }
}

/**
 * @param {templateObject} template A style descriptor, ex {style: {body: {margin: 0, padding: 0}}}
 * @return {string} The interpolated style tag, ex <style> body { margin: 0; padding: 0; } </style>
 */
function makeStyleElement(template){
    //assertSchema('StyleElement', template)
    // one weakness of using this shorthand for style elements is I skip support for attributes on the style tag -- type, media, title
    // so all I can say for now is if you want those things use a link element, for inline style this is all that's available.
    // Could make a distinciton between style elements with objects vs arrays as the cssSelector sets to allow this
     let [[tagName, cssSelectorSet]] = Object.entries(template)
     return interpolate(tagName, Array(makeCSSSelectorSet(cssSelectorSet)))
}

/**
 * 
 * @param {array | object} cssSelectorSet ex. {body: {margin: 0, padding: 0}} or list thereof
 * @param {string} seperator choose whether you want newline separated selectors
 * @return {string} The result of concatenating the selector name (eg body) with the result of making rule pairs, the innerHTML of a style tag
 * Handles media and other @ tags by recursing the rule set and enclosing it in brackets
 */
function makeCSSSelectorSet(cssSelectorSet, seperator = '\n'){
    if(Type.isArray(cssSelectorSet)){
        return cssSelectorSet.map(makeCSSSelectorSet).join(seperator)
    } else {
        return Object.entries(cssSelectorSet).map(
            ([selector, ruleValuePair]) => 
                selector[0] == '@'
                    ? `${selector} {${makeCSSSelectorSet(ruleValuePair)}}`
                    : `${selector} {${makeCSSRuleValuePairs(ruleValuePair)}}`
        ).join(seperator)
    }
}

/**
 * @param  {object} RuleValuePairs ex. {width: "100px", height: "50px"}
 * @param  {string} [seperator] optional, actually I don't know what you would use anything besides default ' '
 * @return {string} ex. `width: 100px; height: 50px;` ready to embed in an attribute or style tag.
 */
function makeCSSRuleValuePairs(RuleValuePairs, seperator = ' '){
    // assertSchema('CSSRuleValuePairs', RuleValuePairs)
    return Object.entries(RuleValuePairs).map(([rule, value]) => 
        `${rule}: ${Array.isArray(value) ? value.join('') : value};`
    ).join(seperator)
}

/**
 * @param  {string} attrName 
 * @param  {string} attrValue
 * @return {string} 
 * the leading space is intentional by the way,
 * so space only exists in <tagName> before any attributes,
 * so if there's no attributes, no extra space inside the tag.
 */
function makeHTMLAttribute(attrName, attrValue){
    attrValue = attrValue
        .replace('"', '&quot;')
        .replace('&', '&amp;')
    return ` ${attrName}="${attrValue}"`
}

/**
 * @param  {string} tagName
 * @param  {array | string | null}  outerHTML A list of strings produced by makeHTMLAttributes, null is OK
 * @param  {array | string | null}  innerHTML A list of pre-interpolated childnodes, the child nodes / text
 * @return {string} The HTML string after interpolation
 */
function interpolate(tagName, innerHTML = [], outerHTML = []){
    innerHTML = Type.isArray(innerHTML) ? innerHTML.join('') : innerHTML // taking care not to add space between HTML tags
    outerHTML = Type.isArray(outerHTML) ? outerHTML.join('') : outerHTML // and attributes will have their own spaces embedded
    // cant deal with arguments of improper type, will throw error calling join
    if(empty_elements.includes(tagName)){
        return `\n<${tagName}${outerHTML}>`
    } else {
        return `\n<${tagName}${outerHTML}>${innerHTML}</${tagName}>`
    }
}