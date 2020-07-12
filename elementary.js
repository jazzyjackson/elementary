/// <reference path="schemas/elementary.d.ts"/>
(function (exports) {
    exports.elementary = elementary;
    var empty_elements = [
        "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr", "!DOCTYPE html"
    ];
    /**
     *
     * Elementary has to decide what to do based on the data structure passd to it
     * An array is recursed over, an object is made into an HTMLElement or an HTMLStyleELement
     * Null is turned into a blank string, bool, numbers and strings are returned as strings.
     */
    function elementary(el) {
        if (el instanceof Array) {
            return el.map(elementary).join('');
        }
        if (el instanceof Object) {
            switch ( /* tagName */Object.keys(el).pop().toLowerCase()) {
                case '!':
                    return bakeHTMLComment(el);
                case 'style':
                    return bakeHTMLStyleElement(el);
                default:
                    return bakeHTMLElement(el);
            }
        }
        else {
            return el ? escapeEntity(String(el)) : "";
        }
    }
    /**
     * Elementary DOM use '!' as a special tagname to indicate a comment that can be printed to the console
     * Could be modified to allow arbitrary object to get printed to console but I'll keep it simple to start
     */
    function bakeHTMLComment(comment) {
        return process.env.NOSCRIPT
            ? "<!-- " + JSON.stringify(comment["!"]) + " -->"
            : "<script>console.warn(JSON.parse(" + JSON.stringify(comment["!"]) + "))</script>";
    }
    /**
     * Everything besides <!-- --> and <style> is a generic HTML element
     * Elementary HTML elements have one of two structures:
     * {tagName: El.ELElement[]}
     * or
     * {tagName: {
     *      style?: El.ELCSSStyleDeclaration;
     *      childNodes?: El.ELHTMLElement[];
     *      [HTMLAttribute: string]: string;
     * }}
     *
     */
    function bakeHTMLElement(el) {
        var _a = Object.entries(el)[0], tagName = _a[0], attributes = _a[1];
        if (attributes instanceof Array) {
            return interpolate(tagName, /* innerHTML (childNodes) */ attributes.map(elementary));
        }
        else {
            var innerHTML = [];
            var outerHTML = [];
            for (var _i = 0, _b = Object.entries(attributes); _i < _b.length; _i++) {
                var _c = _b[_i], attributeName = _c[0], attributeValue = _c[1];
                switch (attributeName) {
                    case 'childNodes':
                        // convert entire childNodes array to a string representing the innerHTML of those nodes
                        innerHTML.push(elementary(attributeValue));
                        break;
                    case 'style':
                        // stringify the CSSStyleDeclaration to inline css, defaults to using space as separator between rules
                        outerHTML.push(" style=\"" + bakeCSSStyleDeclaration(attributeValue) + "\"");
                        break;
                    default:
                        // should probably sanitize these values with .replace('"', '&quot;').replace('&', '&amp;') etc
                        outerHTML.push(" " + attributeName + "=\"" + attributeValue + "\"");
                }
            }
            return interpolate(tagName, innerHTML, outerHTML);
        }
    }
    function escapeEntity(html) {
        return /("|'|&|<|>)/.test(html)
            ? html.replace(/("|'|&|<|>)/g, function (match) { return ({
                "\"": "&quot;",
                "'": "&apos;",
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;"
            })[match]; })
            : html;
    }
    /**
     * Called for HTMLElements whose tagName is style
     * Doesn't support html attributes on the style tag, use a link tag to external stylesheet if you need media/type attributes
     */
    function bakeHTMLStyleElement(el) {
        return interpolate("style", [bakeCSSStyleSheet(el.style)]);
    }
    /**
     * Elementary CSSStyleSheets take the form
     * {[selectorText: string]: CSSStyleDeclaration }
     * However, selectorText starting with '@' defines at rules that can take one of 3 forms, flat, normal, or nested
     *
     * Is only ever called to stitch together the "innerHTML" of a <style> tag
     */
    function bakeCSSStyleSheet(stylesheet) {
        var CSSRules = [];
        for (var _i = 0, _a = Object.entries(stylesheet); _i < _a.length; _i++) {
            var _b = _a[_i], selectorText = _b[0], rule = _b[1];
            if (selectorText[0] == '@') {
                switch (extractAtRule(selectorText)) {
                    case 'namespace':
                    case 'charset':
                    case 'import':
                        // 'flat' rules, one liner, like '@import url("fineprint.css") print; have no body'
                        CSSRules.push(selectorText + " " + rule + ";");
                        break;
                    case 'keyframes':
                    case 'media':
                    case 'supports':
                        // 'nested' rules, like '@media screen and (min-width: 900px)' recurse this function for their body
                        CSSRules.push(selectorText + " {" + bakeCSSStyleSheet(rule) + "}");
                        break;
                    case 'font-face':
                    case 'page':
                        // 'normal' rules aren't any different than non-@-rules, embed CSSStyleDeclaration as their body
                        CSSRules.push(selectorText + " {" + bakeCSSStyleDeclaration(rule) + "}");
                }
            }
            else {
                CSSRules.push(selectorText + " {" + bakeCSSStyleDeclaration(rule) + "}");
            }
        }
        return CSSRules.join('\n');
    }
    /**
     * A helper function for bakeCSSStyleSheet's switch statement, for @import, @font-face, etc
     * Is only called after confirming that selectorText starts with an '@', so its a string of at least length one
     */
    function extractAtRule(selectorText) {
        if (selectorText.includes(' ')) {
            return selectorText.slice(1, selectorText.indexOf(' '));
        }
        else {
            return selectorText.slice(1);
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
    function bakeCSSStyleDeclaration(RuleValuePairs) {
        return Object.entries(RuleValuePairs).map(function (_a) {
            var CSSPropertyName = _a[0], CSSPropertyValue = _a[1];
            return CSSPropertyName + ": " + CSSPropertyValue + ";";
        }).join(' ');
    }
    function interpolate(tagName, innerHTML, outerHTML) {
        if (innerHTML === void 0) { innerHTML = []; }
        if (outerHTML === void 0) { outerHTML = []; }
        // cant deal with arguments of improper type, will throw error calling join
        if (empty_elements.includes(tagName)) {
            return "<" + tagName + outerHTML.join('') + ">";
        }
        else {
            return "<" + tagName + outerHTML.join('') + ">" + innerHTML.join('') + "</" + tagName + ">";
        }
    }
})(typeof exports === 'undefined' ? this : exports);
