'use strict';

function compose(stack) {

  return function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = args.pop();
    // stack.slice() is needed to create a copy of the original stack,
    // otherwise, when running in a for loop, for example, one invocation
    // would consume the step of the stack for all members of the loop.
    chain(stack.slice(), callback).apply(null, [null].concat(args));
  }

  function chain(stack, callback) {
    var f = stack.shift();
    if (!f) return callback;
    return function(err, res) {
      var args = Array.prototype.slice.call(arguments);
      var err = args.shift();
      if (err) return callback(err);
      return f.apply(null, args.concat(chain(stack, callback)));
    }
  }

}

function generateFinalize(steps, callback) {

  var control = {
    steps: steps,
    results: [],
    error: null,
  };

  return function(err, result) {
    // Something went wrong on previous steps.
    // Do nothing, the callback was already triggered.
    if (control.error) return;

    // An error occured. Call the callback immediately.
    if (err) {
      control.error = err;
      return callback(err, control.results);
    }

    // Normal flow.
    control.steps--;
    control.results.push(result);
    if (0 === control.steps) {
      return callback(null, control.results);
    }
  }

}

function forEach(elements, operation, callback) {
  var steps = elements.length;
  var finalize = generateFinalize(steps, callback);
  for (var i = 0; i < steps; i++) {
    operation(elements[i], finalize);
  }
}

module.exports = {
  compose: compose,
  generateFinalize: generateFinalize,
  forEach: forEach
};
