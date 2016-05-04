'use stric';

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

module.exports = compose;
