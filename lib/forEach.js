'use strict';

var finalizer = require('./finalizer');

function forEach(elementsOrConfig, operation, callback) {
  // Default config
  var config = {breakOnError: true};

  // Invoked only with the configuration, return the function
  if (!operation && !callback) {
    config = elementsOrConfig;
    return getFunc(config);
  }

  // Called with the arguments, pipe it to the configured function
  var elements = elementsOrConfig;
  return getFunc(config)(elements, operation, callback);
}

function getFunc(config) {
  var func = forEachBreak;
  if ('breakOnError' in config && !config.breakOnError) {
    func = forEachNoBreak;
  }
  return func;
}

function forEachBreak(elements, operation, callback) {
  var steps = elements.length;
  if (!steps) return callback(null, []);
  var finish = finalizer.callbackOnError(steps, callback);
  for (var i = 0; i < steps; i++) {
    operation(elements[i], finish);
  }
}

function forEachNoBreak(elements, operation, callback) {
  var steps = elements.length;
  if (!steps) return callback(null, []);
  var finish = finalizer.accumulateResultsAndErrors(steps, callback);
  for (var i = 0; i < steps; i++) {
    operation(elements[i], finish);
  }
}

module.exports = {
  forEach: forEach,
  forEachNoBreak: forEachNoBreak,
};
