import {
    ElementaryDOM,
    ELElement,
    ELHTMLComment,
    ELHTMLStyleElement,
    ELHTMLElement,
    ELCSSStyleDeclaration,
    ELCSSStyleSheet
} from "./schemas/elementary"

const empty_elements = [
    "area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"
]
/**
 * 
 * Elementary has to decide what to do based on the data structure passd to it
 * An array is recursed over, an object is made into an HTMLElement or an HTMLStyleELement
 * Null is turned into a blank string, bool, numbers and strings are returned as strings.
 */
module.exports = elementary

function elementary(el: ElementaryDOM) : string
{
    if(el instanceof Array)
    {
        return el.map(elementary).join('')
    }
    if(el instanceof Object)
    {
        switch(/* tagName */ Object.keys(el).pop().toLowerCase())
        {
            case '!':
                return bakeHTMLComment(el as ELHTMLComment)
            case 'style':
                return bakeHTMLStyleElement(el as ELHTMLStyleElement)
            default:
                return bakeHTMLElement(el as ELHTMLElement)
        }
    }
    else
    {
        return el ? String(el) : ""
    }
}


/**
 * Elementary DOM use '!' as a special tagname to indicate a comment that can be printed to the console
 * Could be modified to allow arbitrary object to get printed to console but I'll keep it simple to start
 */
function bakeHTMLComment(comment: ELHTMLComment): string
{
    return process.env.NOSCRIPT
        ? `<!-- ${JSON.stringify(comment["!"])} -->`
        : `<script>console.warn(JSON.parse(${JSON.stringify(comment["!"])}))</script>`
}

/**
 * Everything besides <!-- --> and <style> is a generic HTML element
 * Elementary HTML elements have one of two structures:
 * {tagName: ELElement[]}
 * or
 * {tagName: {
 *      style?: ELCSSStyleDeclaration;
 *      childNodes?: ELHTMLElement[];
 *      [HTMLAttribute: string]: string;
 * }}
 * 
 */
function bakeHTMLElement(el: ELHTMLElement): string
{
    let [[tagName, attributes]] = Object.entries(el)

    if(attributes instanceof Array)
    {
        return interpolate(tagName, /* innerHTML (childNodes) */ attributes.map(elementary))
    }
    else
    {
        let innerHTML = []
        let outerHTML = []
       
        for(var [attributeName, attributeValue] of Object.entries(attributes))
        {
            switch(attributeName)
            {
                case 'childNodes':
                    // convert entire childNodes array to a string representing the innerHTML of those nodes
                    innerHTML.push(elementary(attributeValue as ELElement[]))
                    break
                case 'style':
                    // stringify the CSSStyleDeclaration to inline css, defaults to using space as separator between rules
                    outerHTML.push(` style="${bakeCSSStyleDeclaration(attributeValue as ELCSSStyleDeclaration)}"`)
                    break
                default:
                    // should probably sanitize these values with .replace('"', '&quot;').replace('&', '&amp;') etc
                    outerHTML.push(` ${attributeName}="${attributeValue as string}"`)
             }
        }
        
        return interpolate(tagName, innerHTML, outerHTML)
    }
}

/**
 * Called for HTMLElements whose tagName is style
 * Doesn't support html attributes on the style tag, use a link tag to external stylesheet if you need media/type attributes
 */
function bakeHTMLStyleElement(el: ELHTMLStyleElement): string
{
    return interpolate("style", [bakeCSSStyleSheet(el.style)])
}

/**
 * Elementary CSSStyleSheets take the form
 * {[selectorText: string]: CSSStyleDeclaration }
 * However, selectorText starting with '@' defines at rules that can take one of 3 forms, flat, normal, or nested
 * 
 * Is only ever called to stitch together the "innerHTML" of a <style> tag
 */
function bakeCSSStyleSheet(stylesheet: ELCSSStyleSheet): string
{
    let CSSRules = []
    for(var [selectorText, rule] of Object.entries(stylesheet))
    {
        if(selectorText[0] == '@')
        {
            switch(extractAtRule(selectorText))
            {
                case 'namespace':
                case 'charset':
                case 'import':
                    // 'flat' rules, one liner, like '@import url("fineprint.css") print; have no body'
                    CSSRules.push(`${selectorText} ${rule as string};`)
                    break
                case 'keyframes':
                case 'media':
                case 'supports':
                    // 'nested' rules, like '@media screen and (min-width: 900px)' recurse this function for their body
                    CSSRules.push(`${selectorText} {${bakeCSSStyleSheet(rule as ELCSSStyleSheet)}}`)
                    break
                case 'font-face':
                case 'page':
                    // 'normal' rules aren't any different than non-@-rules, embed CSSStyleDeclaration as their body
                    CSSRules.push(`${selectorText} {${bakeCSSStyleDeclaration(rule as ELCSSStyleDeclaration)}}`)
            }
        }
        else
        {
            CSSRules.push(`${selectorText} {${bakeCSSStyleDeclaration(rule as ELCSSStyleDeclaration)}}`)
        }
    }
    return CSSRules.join('\n')
}

/**
 * A helper function for bakeCSSStyleSheet's switch statement, for @import, @font-face, etc
 * Is only called after confirming that selectorText starts with an '@', so its a string of at least length one
 */
function extractAtRule(selectorText: string): string
{
    if(selectorText.includes(' '))
    {
        return selectorText.slice(1, selectorText.indexOf(' '))
    }
    else
    {
        return selectorText.slice(1)
    }
}

/**
 * Takes an object which is a mapping 
 * I want to use TypeScript DOM's CSSStyleDeclaration type so I validate css descriptor names,
 * but that requires using javascriptish camel case and converting to valid css, which I kind of don't like.
 * and TypeScript CSSStyleDeclaration doens't include the 'src' descriptor for @font-face, so I would need to add that somehow 
 * 
 * defaults to separating declarations with a single space for inline style, but overridden with '\n' for stylesheets
 */
function bakeCSSStyleDeclaration(RuleValuePairs: ELCSSStyleDeclaration): string
{
    return Object.entries(RuleValuePairs).map
    (
        ([CSSPropertyName, CSSPropertyValue]) => `${CSSPropertyName}: ${CSSPropertyValue};`
    ).join(' ')
}

function interpolate(tagName: string, innerHTML:string[] = [], outerHTML:string[] = []): string
{
    // cant deal with arguments of improper type, will throw error calling join
    if(empty_elements.includes(tagName))
    {
        return `<${tagName}${outerHTML.join('')}>`
    }
    else
    {
        return `<${tagName}${outerHTML.join('')}>${innerHTML.join('')}</${tagName}>`
    }
}