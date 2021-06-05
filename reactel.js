/// <reference path="schemas/elementary.d.ts"/>
// a minimum viable function
// call React.createElement recursively from within a global method
// break down the el structure into tagName, innerHTML and outerHTML
// innerHTML is an array of child nodes, maybe including strings and nulls
// outerHTML is a rolled up object of all the attributes, maybe I'll replace class with className on the call step
// So I have types for my input object, El.ementaryDOM
// I just need a type for my output, a React Element
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
            return el.map(elementary); // an array is a valid reactNode
        }
        if (el instanceof Object) {
            switch ( /* tagName */Object.keys(el).pop().toLowerCase()) {
                // case '!':
                //     return bakeHTMLComment(el as El.HTMLComment)
                // case 'style':
                // I guess for a style tag I could just run my css stringification algo and pass that as the children parameter of style tag. Right?
                // return bakeHTMLStyleElement(el as El.HTMLStyleElement)
                default:
                    return bakeHTMLElement(el);
            }
        }
        else {
            // return el ? escapeEntity(String(el)) : ""
            return el && String(el); // Could leave it a number, does it make a difference? Booleans are ignored by React, this will show up as the string true
            // return el ? React.createElement(el as string) : null
        }
    }
    function bakeHTMLElement(el) {
        var _a = Object.entries(el)[0], tagName = _a[0], attributes = _a[1];
        // why not allow attributes to be a string, and let {"h1": "hello world"} be valid Elem?
        // because then there's 3 different types of attribute, this way there's only 2
        if (attributes instanceof String) {
            throw new Error("TypeError: Passed string as only attribute to a tagname");
        }
        else if (attributes instanceof Array) {
            // return interpolate(tagName, /* innerHTML (childNodes) */ attributes.map(elementary))
            return React.createElement(tagName, null, elementary(attributes));
        }
        else {
            // depending on name of prop, build up props + children
            // if attribute name is style, pass the object as-is
            // if children / childNodes, recurse as el.ementaryDOM
            var children = [];
            var props = {};
            for (var _i = 0, _b = Object.entries(attributes); _i < _b.length; _i++) {
                var _c = _b[_i], attributeName = _c[0], attributeValue = _c[1];
                if (attributeName == 'children') {
                    children = elementary(attributeValue);
                }
                else {
                    props[attributeName] = attributeValue; // className, any attr, 
                    // this should set {style: {color: red}} appropriately, attributeValue is just a StyleDeclaration, pass it on
                }
            }
            return React.createElement(tagName, props, empty_elements.includes(tagName) ? null : children);
        }
    }
})(typeof exports === 'undefined' ? this : exports);
