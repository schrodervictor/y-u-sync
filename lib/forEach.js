'use strict';

var finalizer = require('./finalizer');

function forEach(elements, operation, callback) {
  var steps = elements.length;
  var finish = finalizer(steps, callback);
  for (var i = 0; i < steps; i++) {
    operation(elements[i], finish);
  }
}

module.exports = forEach;
