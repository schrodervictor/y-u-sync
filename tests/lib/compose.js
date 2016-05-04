'use strict';

describe('#compose(stack)', function() {

  var chai = require('chai');
  var sinon = require('sinon');
  var sinonChai = require('sinon-chai');
  var expect = chai.expect;
  chai.use(sinonChai);

  var compose = require('../../lib/compose.js');

  var sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
  });

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
