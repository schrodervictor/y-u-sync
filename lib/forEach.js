'use strict';

var finalizer = require('./finalizer');

function forEach(elements, operation, callback) {
  var steps = elements.length;
  var finish = finalizer.callbackOnError(steps, callback);
  for (var i = 0; i < steps; i++) {
    operation(elements[i], finish);
  }
}

function forEachNoBreak(elements, operation, callback) {
  var steps = elements.length;
  var finish = finalizer.accumulateResultsAndErrors(steps, callback);
  for (var i = 0; i < steps; i++) {
    operation(elements[i], finish);
  }
}

module.exports = {
  forEach: forEach,
  forEachNoBreak: forEachNoBreak,
};
