#!/usr/bin/env node
'use strict';

if (process.argv.length < 3) {
  throw new ArgumentException(
    'Wrong argument number specified, an input file and (optionally)'
    + "the database type ('sql', 'mongodb' or 'cassandra') must be supplied, "
    + "exiting now.");
}

var fs = require('fs'),
  	chalk = require('chalk'),
    child_process = require('child_process'),
  	XMIParser = require('./xmiparser'),
  	EntitiesCreator = require('./entitiescreator'),
    ClassScheduler = require('./scheduler');


if (!fs.existsSync('.yo-rc.json') && process.argv.length == 3) {
 throw new ArgumentException(
    'The database type must either be supplied, or a .yo-rc.json file must'
    + 'exist in the current directory.');
}

var type;

if (fs.existsSync('.yo-rc.json') && process.argv.length >= 3) {
  type = JSON.parse(
    fs.readFileSync('./.yo-rc.json'))['generator-jhipster']['databaseType'];
} else if (!fs.existsSync('.yo-rc.json') && process.argv.length >= 4) {
  type = process.argv[3];
}

var parser = new XMIParser(process.argv[2], type); 

parser.parse();

var scheduler = new ClassScheduler(
  Object.keys(parser.getClasses()),
  parser.getInjectedFields()
);

scheduler.schedule();

var scheduledClasses = scheduler.getOrderedPool();

var creator = new EntitiesCreator(parser);
creator.createEntities();
creator.writeJSON();

createEntities(scheduledClasses, parser.getClasses());

/**
 * Execute the command yo jhipster:entity for all the classes in the right order
 */
function createEntities(scheduledClasses, classes) {

  for (var i = 0; i < scheduledClasses.length; i++) {
    console.log(chalk.red(classes[scheduledClasses[i]].name));
  }

  var i = 0;
  executeEntity(scheduledClasses, classes, i);
}

function executeEntity(scheduledClasses, classes, index) {
  var child;
  console.log(chalk.red(
      "================= "
      + classes[scheduledClasses[index]].name
      + " ================="));
  child = child_process.exec(
    "yo jhipster:entity "
    + classes[scheduledClasses[index]].name 
    + " --force", function (error, stdout, stderr) {

      console.log(chalk.green(stdout));
      console.log();

      if (error !== null) {
        console.log(chalk.red(error));
      }

      if(stderr == '' || stderr != null) {
        console.log( stderr);
      }

      // the end condition
      if(index + 1 >= scheduledClasses.length) {
        return;
      }
      executeEntity(scheduledClasses, classes, index + 1);
  });
}

function ArgumentException(message) {
  this.name = 'ArgumentException';
  this.message = (message || '');
}
ArgumentException.prototype = new Error();
