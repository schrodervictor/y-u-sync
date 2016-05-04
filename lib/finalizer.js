'use strict';

function finalizer(steps, callback) {

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

module.exports = finalizer;
