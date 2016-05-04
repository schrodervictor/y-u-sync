'use strict';

describe('forEach', function() {

  var chai = require('chai');
  var sinon = require('sinon');
  var sinonChai = require('sinon-chai');
  var expect = chai.expect;
  chai.use(sinonChai);

  var forEachModule = require('../../lib/forEach');

  var sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
  });

  describe('#forEach(elements, operation, callback)', function() {

    var forEach = forEachModule.forEach;

    it(
      'should loop asynchronously through the elements, applying the ' +
      'operation and call the callback at the end',
      function(done) {

        var elements = [1, 3, 5, 7, 9];

        // Forcing the operation to return in the reverse order
        var operation = sandbox.spy(function(element, callback) {
          var sumOne = function() { callback(null, element + 1); }
          setTimeout(sumOne, 22 - element*2);
        });

        forEach(elements, operation, function(err, result) {
          expect(result).to.deep.equals([10, 8, 6, 4, 2]);
          expect(operation).to.have.callCount(5);
          done();
        });

      }
    );

    it(
      'should break on errors and call the callback immediately',
      function(done) {

        var elements = [1, 3, 5, 7, 9];

        var error5 = new Error('No fives in this function, sorry');
        var error9 = new Error('No nines in this function, sorry');

        // Forcing the operation to return in the reverse order
        var sumOne = sandbox.spy(function(element, callback) {
          if (5 === element) return callback(error5);
          if (9 === element) return callback(error9);
          callback(null, element + 1);
        });

        forEach(elements, sumOne, function(err, result) {
          expect(err).to.deep.equals(error5);
          expect(result).to.deep.equals([2, 4]);
          expect(sumOne).to.have.callCount(3);
          setTimeout(function() {
            // Results and errors won't change after the first error,
            // but all function calls will actually happen anyway!!!
            expect(err).to.deep.equals(error5);
            expect(result).to.deep.equals([2, 4]);
            expect(sumOne).to.have.callCount(5);
            done();
          }, 0);
        });

      }
    );

  });

  describe('#forEachNoBreak(elements, operation, callback)', function() {

    var forEachNoBreak = forEachModule.forEachNoBreak;

    it(
      'should work exactly like forEach in the normal case (no errors)',
      function(done) {

        var elements = [1, 3, 5, 7, 9];

        // Forcing the operation to return in the reverse order
        var operation = sandbox.spy(function(element, callback) {
          var sumOne = function() { callback(null, element + 1); }
          setTimeout(sumOne, 22 - element*2);
        });

        forEachNoBreak(elements, operation, function(err, result) {
          expect(result).to.deep.equals([10, 8, 6, 4, 2]);
          expect(operation).to.have.callCount(5);
          done();
        });

      }
    );

    it(
      'should NOT break on errors, but call the callback only at the end',
      function(done) {

        var elements = [1, 3, 5, 7, 9];

        var error5 = new Error('No fives in this function, sorry');
        var error9 = new Error('No nines in this function, sorry');

        // Forcing the operation to return in the reverse order
        var sumOne = sandbox.spy(function(element, callback) {
          if (5 === element) return callback(error5);
          if (9 === element) return callback(error9);
          callback(null, element + 1);
        });

        forEachNoBreak(elements, sumOne, function(err, result) {
          expect(err).to.deep.equals([error5, error9]);
          expect(result).to.deep.equals([2, 4, 8]);
          expect(sumOne).to.have.callCount(5);
          done();
        });

      }
    );

  });

});
