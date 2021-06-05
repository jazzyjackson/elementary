Competitors: JSX, Hyperscript
Just a matter of taste of what syntax makes sense. I like having one consistent tree with style and markup -- keeping it POJO also makes it clear where I can use arbitrary javascript -- build arbitrary expressions that resolve to the value of an object, then convert to react app.

Since JSON is now valid tree syntax, I can use native 'require' to load templates on serverside, so could be a nice way to define data and structure with a common syntax.

Becomes a CRM pretty quickly if you can add data files that are then rendered by the templates -- this requires running fs.dir from within the template so it can iterate over data files during the build step, still, pretty quick way to render a static website for free github hosting.

Create a github account, and the files my server renders can be sync'd to your github account, for a fee!

Instead of rendering strings, return React components
For comments, just print to console.warn

Q: can I refer to react components by their string name or do I have to pass the react class?

Step 2:
Demonstrate a form component that watches itself for changes and occasionally calls a liftform func that updates the global state. 

Global state then chooses which piece of the DOM is affected by the change and replaces just those pieces.

Maybe when elementary runs and grabs the keyname on the object, it can decide if there's a react class with that name, pass that, vs fallback to a string.