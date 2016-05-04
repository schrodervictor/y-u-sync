'use strict';

describe('finalizer', function() {

  var chai = require('chai');
  var sinon = require('sinon');
  var sinonChai = require('sinon-chai');
  var expect = chai.expect;
  chai.use(sinonChai);

  var finalizer = require('../../lib/finalizer');

  var sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
  });

  describe('#callbackOnError(steps, callback)', function() {

    var callbackOnError = finalizer.callbackOnError;

    it(
      'should wrap the callback and call it only after "step" calls',
      function(done) {

        var sumOne = sandbox.spy(function(param, callback) {
          callback(null, param + 1);
        });

        var finish = callbackOnError(5, function(err, result) {
          expect(result).to.deep.equals([2, 2, 2, 2, 2]);
          expect(sumOne).to.have.callCount(5);
          done();
        });

        for (var i = 0; i < 5; i++) {
          sumOne(1, finish);
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

        var finish = callbackOnError(5, function(err, result) {
          expect(err).to.equals(error);
          expect(result).to.deep.equals([2, 2]);
          expect(sumOne).to.have.callCount(3);
          done();
        });

        for (var i = 0; i < 5; i++) {
          sumOne(1, finish);
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

        var finish = callbackOnError(5, callback);

        for (var i = 0; i < 5; i++) {
          broken('whatever', finish);
        }

        function expectations() {
          expect(broken).to.have.callCount(5);
          expect(callback).to.have.been.calledOnce;
          done();
        }

      }
    );

  });

  describe('#accumulateResultsAndErrors(steps, callback)', function() {

    var accumulateResultsAndErrors = finalizer.accumulateResultsAndErrors;

    it(
      'should wrap the callback and call it only after "step" calls',
      function(done) {

        var sumOne = sandbox.spy(function(param, callback) {
          callback(null, param + 1);
        });

        var finish = accumulateResultsAndErrors(5, function(err, result) {
          expect(err).to.be.null;
          expect(result).to.deep.equals([2, 2, 2, 2, 2]);
          expect(sumOne).to.have.callCount(5);
          done();
        });

        for (var i = 0; i < 5; i++) {
          sumOne(1, finish);
        }

      }
    );

    it(
      'should call the callback only after all steps, even if an error ' +
      'occurs',
      function(done) {

        var countForError = 3;

        var error = new Error('An error during the loop');

        var sumOne = sandbox.spy(function(param, callback) {
          if (!--countForError) return callback(error);
          callback(null, param + 1);
        });

        var finish = accumulateResultsAndErrors(5, function(err, result) {
          expect(err).to.deep.equals([error]);
          expect(result).to.deep.equals([2, 2, 2, 2]);
          expect(sumOne).to.have.callCount(5);
          done();
        });

        for (var i = 0; i < 5; i++) {
          sumOne(1, finish);
        }

      }
    );

    it(
      'should not call the callback more than once (if errors occurs)',
      function(done) {

        var error = new Error('An error during the loop');

        var broken = sandbox.spy(function(param, callback) {
          callback(error);
        });

        var callback = sandbox.spy(function(err, results) {
          setTimeout(function() {
            expectations(err, results);
          }, 0);
        });

        var finish = accumulateResultsAndErrors(5, callback);

        for (var i = 0; i < 5; i++) {
          broken('whatever', finish);
        }

        function expectations(err, results) {
          expect(broken).to.have.callCount(5);
          expect(callback).to.have.been.calledOnce;
          expect(err).to.deep.equal([error, error, error, error, error]);
          expect(results).to.be.null;
          done();
        }

      }
    );

  });

});
