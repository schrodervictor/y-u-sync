'use strict';

function callbackOnError(steps, callback) {

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

function accumulateResultsAndErrors(steps, callback) {

  var control = {
    steps: steps,
    results: [],
    errors: [],
  };

  return function(err, result) {
    control.steps--;

    if (err) {
      control.errors.push(err);
    }

    if ('undefined' !== typeof result) {
      control.results.push(result);
    }

    if (0 === control.steps) {
      var errors = control.errors.length ? control.errors : null;
      var results = control.results.length ? control.results : null;
      return callback(errors, results);
    }
  }

}

module.exports = {
  callbackOnError: callbackOnError,
  accumulateResultsAndErrors: accumulateResultsAndErrors,
}
