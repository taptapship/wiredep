// Like you would expect your `karma.conf.js` file to look...
module.exports = function(config){
  config.files = [
    // These are the most important...
    // bower:js
    // endbower

    // But just in case...
    // bower:css
    // endbower
    "scripts/app/app.js"
  ]; // END config.files

  // Mentioning bower inside a comment should have no effect.
};
