// Like you would expect your `karma.conf.js` file to look...
module.exports = function(config){
  config.files = [
    // These are the most important...
    // bower:js
    "../bower_components/jquery/jquery.js",
    "../bower_components/codecode/dist/codecode.js",
    "../bower_components/bootstrap/dist/js/bootstrap.js",
    // endbower

    // But just in case...
    // bower:css
    "../bower_components/codecode/dist/codecode.css",
    "../bower_components/bootstrap/dist/css/bootstrap.css",
    // endbower
    "scripts/app/app.js"
  ]; // END config.files

  // Mentioning bower inside a comment should have no effect.
};
