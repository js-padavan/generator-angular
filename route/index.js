'use strict';
var path = require('path');
var chalk = require('chalk');
var util = require('util');
var ScriptBase = require('../script-base.js');
var angularUtils = require('../util.js');
// var yeoman = require('yeoman-generator');

var Generator = module.exports = function Generator() {
  ScriptBase.apply(this, arguments);
  this.uiRouter = false;
  this.ngRouter = false;
  var bower = require(path.join(process.cwd(), 'bower.json'));
    // detecting which type of router is used
  var match = require('fs').readFileSync(path.join(
    this.env.options.appPath,
    'scripts/app.' + (this.env.options.coffee ? 'coffee' : 'js')
  ), 'utf-8').match(/\.when/);
  if (
      bower.dependencies['angular-route'] ||
      bower.devDependencies['angular-route'] ||
      match !== null
  ) {
      this.ngRouter = true;
  }

  var match = require('fs').readFileSync(path.join(
    this.env.options.appPath,
    'scripts/app.' + (this.env.options.coffee ? 'coffee' : 'js')
  ), 'utf-8').match(/\.state/);
  if (
      bower.dependencies['angular-ui-router'] ||
      bower.devDependencies['angular-ui-router'] ||
      match !== null
  ) {
    this.uiRouter = true;
  }

  if (this.uiRouter)
    this.log(chalk.blue('\n generating route for ui-router'));
  if (this.ngRouter)
    this.log(chalk.blue('\n generating route for ng-router'));


  this.routerModule = this.uiRouter || this.ngRouter

  this.on('end', function() {
    this.invoke('angular:controller', {
      args: [this.controllerName]
    });
    this.invoke('angular:view', {
      args: [this.viewName]
    });
  })
};

util.inherits(Generator, ScriptBase);

Generator.prototype.askOptions = function askOptions() {
  var done = this.async();
  var promptCb;
  var prompts = [{
    type: 'input',
    name: 'url',
    message: 'Route url: ',
    when: function() {
      return this.ngRouter || this.uiRouter
    }.bind(this),
    default: function() {
      var url = (this.ngRouter === true ? this.name : this.name.split('.').pop());
      return "/" + url;
    }.bind(this)
  }]

  if (this.ngRouter) {
    promptCb = function(props) {
      this.viewName = this.name;
      this.controllerName = this.name;
      this.url = props.url;
      done();
    }.bind(this);
  }
  else {
    // ui-router is used
    promptCb = function(props) {
      this.controllerName = this.name.split(/\.|-/).map(function(str){
        return str[0].toUpperCase() + str.substr(1)
      }).join('')
      this.viewName = this.name;
      this.url = props.url;
      this.state = this.name;
      done();
    }.bind(this);
  }


  this.prompt(prompts, promptCb);
}

Generator.prototype.rewriteAppJs = function () {
  var coffee = this.env.options.coffee;
  var ngRouter = this.ngRouter;

  function generateTemplateName(_name) {
    return "'views/" + _name.toLowerCase() + ".html'"
  }

  function generateCtrlName(_name) {
    return "'" + _name +"Ctrl'";
  }

  if (!this.routerModule) {
    this.on('end', function () {
      this.log(chalk.yellow(
        '\nthis project was generated without routing module. Skipping adding the route to ' +
        'scripts/app.' + (coffee ? 'coffee' : 'js')
      ));
    });
    return;
  }



  var needle;
  if (this.uiRouter)
    needle = '.state(';
  if (this.ngRouter)
    needle = '.otherwise'


  var config = {
    file: path.join(
      this.env.options.appPath,
      'scripts/app.' + (coffee ? 'coffee' : 'js')
    ),
    needle: needle,
    splicable: [
      "  templateUrl: " + generateTemplateName(this.viewName) + (coffee ? "" : "," ),
      "  controller: " + generateCtrlName(this.controllerName) + (coffee || ngRouter ? "" : ",")
    ]
  };

  if (coffee && this.ngRouter) {
    config.splicable.unshift(".when '" + this.url + "',");
  }
  if (!coffee && this.ngRouter){
    config.splicable.unshift(".when('" + this.url + "', {");
    config.splicable.push("})");
  }


  if (coffee && this.uiRouter) {
    config.splicable.unshift(".state '" + this.state + "',");
    config.push("url: '" + this.url + "'")
  }
  if (!coffee && this.uiRouter) {
    config.splicable.unshift(".state('" + this.state + "', {");
    config.splicable.push("url: '" + this.url + "'})");
  }

  angularUtils.rewriteFile(config);
};
