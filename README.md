Y U Sync?
=========

It's very important to avoid blocking operations when coding Node.js, due to
its single thread nature. But it can make some tasks a bit more trick to
control, like loops, function chains, map/reduce and others.

We also hate stateful applications. In case you keep a lot of state in your
application, maybe this is not the right module for you. Here we are
intentionally not caring about binding functions to objects. We treat
functions as data (and you should do it too!), so we can pass them around
easily. Don't worry, JavaScript is smart enough to keep track of the context
so use it!!

## Instalation

If you are reading this, you know how to install a npm module. Just put it in
your dependencies list or install it globally if you are one of those people.

## How to use it

Take a look on the tests if you want a better insight of how thigs really
work. It seems like black magic sometimes, but it's not.

These are the currently available functionality:

### compose([function, function, ...])

Composes a stack of asynchronous functions in a non-blocking fashion and
returns a function that has the same signature of the first function of the
stack and accepts a callback with the same signature expected by the last
function of the stack.

```javascript
// Given these asynchronous functions:

function sumOne(number, callback) {
  callback(null, number + 1);
}

function timesTwo(number, callback) {
  callback(null, number * 2);
}

// Instead of a callback hell:

sumOne(10, function(err, result) {
  if (err) return callback(err);
  sumOne(result, function(err, result) {
    if (err) return callback(err);
    timesTwo(result, function(err, result) {
      if (err) return callback(err);
      timesTwo(result, function(err, result) {
        if (err) return callback(err);
        console.log('Final result:', result);
      });
    });
  });
});


// You can simply compose the operations and call the composite

var compose = require('y-u-sync').compose;

var sumTwoTimesFour = compose([sumOne, sumOne, timesTwo, timesTwo]);

sumTwoTimesFour(10, function(err, result) {
  if (err) return callback(err);
  console.log('Final result:', result);
});
```

### forEach(array, function, callback)

This is actually an asynchronous for loop. The first parameter can be any
array, the second is an asynchronous function that takes the element as the
first parameter and a callback. The third argument is the callback, which
should expect eventual error as the first parameter and the array of results
as the second parameter. Note that the order of the original array **IS NOT
PRESERVED!**.

The callback is called only once at the end with the array of results as the
second parameter. If an error occurs, the callback is called imediatelly with
the error as the first parameter and the results collected so far. Note that,
due to the asynchronous nature of this function, all the operations can still
be executed.

```javascript
// Given an array and an expensive asynchronous operation:

var numbers = [10, 20, 30, 40, 50];

function doubleAndSaveToDB(number, callback) {
  db.getConnection('db-name', function(err, conn) {
    if (err) return callback(err);
    conn.table('table-name').save(number * 2, callback);
  });
}

// Instead of trying to control the flow yourself:

var steps = numbers.length;
var results = [];

if (!steps) return callback(null, results);

for (var i in numbers) {
  (function(number) {
    doubleAndSaveToDB(number, finish);
  )(numbers[i]);
}

function finish(err, result) {
  if (err) return callback(err);
  results.push(result);
  if (!--steps) return callback(null, results);
}

// Simply do this:

var forEach = require('y-u-sync').forEach;

forEach(numbers, doubleAndSaveToDB, callback);
```

### Configuring forEach({breakOnError: true|false})

The `forEach` function mentioned above can be configured to have a different
behavior on errors. By default, `forEach` will break on the first error and
call the callback. This might be useful to continue with the normal program
flow, but can also be misleading, because the async operation will execute
anyways for all the elements in the array. This is unavoidable due to the
asynchronous nature of the function.

To have better control of what failed or not, one can configure with the flag
`{breakOnError: false}` to order the `forEach` function to collect all the
errors that happened. In this case, a better error handling has to be kept in
mind for the callback though (once a simple `if (!err)` won't work.
but with different reaction on errors.

Here is an example:

```javascript
var forEach = require('y-u-sync').forEach({breakOnError: false});

var error5 = new Error('No fives allowed, sorry');
var error9 = new Error('No nines allowed, sorry');

function sumOne(param, callback) {
  if (5 === param) return callback(error5);
  if (9 === param) return callback(error9);
  return callback(null, param + 1);
}

forEach([1, 3, 5, 7, 9], sumOne, function(errors, results) {
  // errors is [error5, error9]
  // results is [2, 4, 8]
});

var forEach = require('y-u-sync').forEach({breakOnError: true});

// Comparing with forEach
forEach([1, 3, 5, 7, 9], sumOne, function(err, results) {
  // err is error5 (the first to happen)
  // results is [2, 4] (everything before the error)
});
```

Both flavors exist because they attend different use cases. Choose your weapon
wisely!

The old reference to `forEachNoBreak` still exists, but it's usage is
considered deprecated and is disencouraged as it will be removed in the
future.

`forEach` is exactly the same as `forEach({breakOnError: true})`
`forEachNoBreak` is exactly the same as `forEach({breakOnError: false})`


## Unit tests

This module was TDD'ed. 100% test coverage using mocha+chai+sinon.
Reading the tests is the best way to learn how this thing really works.

## Contributing

Fork the repo, create a branch, do awesome additions and submit a
pull-request. Only PR's with tests will be considered.

## Releases

* 0.2.0:
  * Introduces possibility to configure the `forEach` function
  * Deprecates `forEachNoBreak`
  * Clean up in package.json
  * Added CI with travis-ci.org

* 0.1.1:
  * Bugfix: `forEach` and `forEachNoBreak` never call the callback in case the
    array is empty. Now they call immediately.

* 0.1.0:
  * Changes the structure of the module
  * Adds `forEachNoBreak`

* 0.0.2:
  * Increases test coverage to 100%

* 0.0.1:
  * Initial release (extracted from private project)
