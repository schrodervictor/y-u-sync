'use strict';

describe('LIB: y-u-sync', function() {

  var chai = require('chai');
  var sinon = require('sinon');
  var sinonChai = require('sinon-chai');
  var expect = chai.expect;
  chai.use(sinonChai);

  var lib = require('../index.js');

  var sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
  });

  describe('#compose(stack)', function() {

    var compose = lib.compose;

    it(
      'should compose an asynchronous function from a stack of ' +
      'asynchronous functions',
      function(done) {

        var sumOne = sandbox.spy(function(param, callback) {
          callback(null, param + 1);
        });

        var duplicateParam = sandbox.spy(function(param, callback) {
          callback(null, param, param);
        });

        var multiply = sandbox.spy(function(param1, param2, callback) {
          callback(null, param1*param2);
        });

        var stack = [
          sumOne,
          sumOne,
          duplicateParam,
          multiply
        ];

        var operations = compose(stack);

        expect(operations).to.be.a('function');

        operations(3, function(err, result) {
          expect(sumOne).to.have.been.calledTwice;
          expect(duplicateParam).to.have.been.calledOnce;
          expect(multiply).to.have.been.calledOnce;
          expect(result).to.equals(25);
          done();
        });

      }
    );

    it(
      'should produce independent composite functions from the same stack',
      function(done) {

        var sumOne = sandbox.spy(function(param, callback) {
          callback(null, param + 1);
        });

        var stack = [
          sumOne,
          sumOne,
          sumOne,
        ];

        var sumThree = compose(stack);

        var numOps = 2;

        sumThree(3, function(err, result) {
          expect(result).to.equals(6);
          finalize();
        });

        sumThree(2, function(err, result) {
          expect(result).to.equals(5);
          finalize();
        });

        function finalize() {
          if (--numOps) return;
          expect(sumOne).to.have.callCount(6);
          done();
        }

      }
    );

    it(
      'should break the stack and call the callback if an error occurs',
      function(done) {

        var stepOne = sandbox.spy(function(param, callback) {
          callback(null, param);
        });

        var stepTwo = sandbox.spy(function(param, callback) {
          callback(null, param);
        });

        var error = new Error('Oh-Oh! Unexpected error');

        var stepBroken = sandbox.spy(function(param, callback) {
          callback(error);
        });

        var stepThree = sandbox.spy(function(param, callback) {
          callback(null, param);
        });

        var operations = compose([
          stepOne,
          stepTwo,
          stepBroken,
          stepThree
        ]);

        operations('whatever param', function(err, result) {
          expect(stepOne).to.have.been.calledOnce;
          expect(stepTwo).to.have.been.calledOnce;
          expect(stepBroken).to.have.been.calledOnce;
          expect(stepThree).to.not.have.been.called;
          expect(err).to.equal(error);
          expect(result).to.be.undefined;
          done();
        });

      }
    );

    it(
      'should produce composite functions that are chainable as well',
      function(done) {
        var concatA = sandbox.spy(function(param, callback) {
          callback(null, param + ' A');
        });

        var concatB = sandbox.spy(function(param, callback) {
          callback(null, param + ' B');
        });

        var concatAB = compose([concatA, concatB]);

        var concatBAB = compose([concatB, concatAB]);

        var concatBABA = compose([concatBAB, concatA]);

        concatBABA('test', function(err, result) {
          expect(concatA).to.have.been.calledTwice;
          expect(concatB).to.have.been.calledTwice;
          expect(result).to.equal('test B A B A');
          done();
        });

      }
    );

  });

  describe('#generateFinalize(steps, callback)', function() {

    var generateFinalize = lib.generateFinalize;

    it(
      'should wrap the callback and call it only after "step" calls',
      function(done) {

        var sumOne = sandbox.spy(function(param, callback) {
          callback(null, param + 1);
        });

        var finalize = generateFinalize(5, function(err, result) {
          expect(result).to.deep.equals([2, 2, 2, 2, 2]);
          expect(sumOne).to.have.callCount(5);
          done();
        });

        for (var i = 0; i < 5; i++) {
          sumOne(1, finalize);
        }

      }
    );

    it(
      'should call the callback immediately if an error occurs and return ' +
      'the results so far',
      function(done) {

        var countForError = 3;

        var error = new Error('An error during the loop');

        var sumOne = sandbox.spy(function(param, callback) {
          if (!--countForError) return callback(error);
          callback(null, param + 1);
        });

        var finalize = generateFinalize(5, function(err, result) {
          expect(err).to.equals(error);
          expect(result).to.deep.equals([2, 2]);
          expect(sumOne).to.have.callCount(3);
          done();
        });

        for (var i = 0; i < 5; i++) {
          sumOne(1, finalize);
        }

      }
    );

    it(
      'should not call the callback more than once (if errors occurs)',
      function(done) {

        var broken = sandbox.spy(function(param, callback) {
          callback(new Error('An error during the loop'));
        });

        var callback = sandbox.spy(function() {
          // setTimeout is needed here to change the order of
          // the internal event loop stack (so we know something
          // else in the for loop will execute)
          setTimeout(expectations, 0);
        });

        var finalize = generateFinalize(5, callback);

        for (var i = 0; i < 5; i++) {
          broken('whatever', finalize);
        }

        function expectations() {
          expect(broken).to.have.callCount(5);
          expect(callback).to.have.been.calledOnce;
          done();
        }

      }
    );

  });

  describe('#forEach(elements, operation, callback)', function() {

    var forEach = lib.forEach;

    it(
      'should loop asynchronously through the elements, applying the ' +
      'operation and call the callback at the end',
      function(done) {

        var elements = [1, 3, 5, 7, 9];

        // Forcing the operation to return in the reverse order
        var operation = sandbox.spy(function(element, callback) {
          var sumOne = function() { callback(null, element + 1); }
          setTimeout(sumOne, 11 - element);
        });

        forEach(elements, operation, function(err, result) {
          expect(result).to.deep.equals([10, 8, 6, 4, 2]);
          expect(operation).to.have.callCount(5);
          done();
        });

      }
    );

  });

});
