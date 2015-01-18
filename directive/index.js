'use strict';
var util = require('util');
var ScriptBase = require('../script-base.js');


var Generator = module.exports = function Generator() {
  ScriptBase.apply(this, arguments);
};

util.inherits(Generator, ScriptBase);

Generator.prototype.askForTemplateType = function askForTemplateType() {
  var done = this.async();
  var name = this.name;
  this.prompt([{
    name: 'templateInFile',
    type: 'confirm',
    message: 'Would you like to have template in separate ',
    default: 'true'
    }, {
    name: 'templateName',
    type: 'input',
    message: 'Template name: ',
    when: function(props) {
      return props.templateInFile
    },
    default: name
  }], function(props) {
    this.templateInFile = props.templateInFile;
    this.templateName = props.templateName;
    done();
  }.bind(this))
}

Generator.prototype.createDirectiveFiles = function createDirectiveFiles() {
  console.log('generating directive');
  this.generateSourceAndTest(
    'directive',
    'spec/directive',
    'directives',
    this.options['skip-add'] || false
  );
  if (this.templateInFile) {
    this.invoke('angular:view', {
      args: [this.templateName]
    });
  }
};
