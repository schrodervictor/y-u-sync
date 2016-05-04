'use strict';

describe('#forEach(elements, operation, callback)', function() {

  var chai = require('chai');
  var sinon = require('sinon');
  var sinonChai = require('sinon-chai');
  var expect = chai.expect;
  chai.use(sinonChai);

  var forEach = require('../../lib/forEach');

  var sandbox = sinon.sandbox.create();

  afterEach(function() {
    sandbox.restore();
  });

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

      var error = new Error('No fives in this function, sorry');

      // Forcing the operation to return in the reverse order
      var sumOne = sandbox.spy(function(element, callback) {
        if (5 === element) return callback(error);
        callback(null, element + 1);
      });

      forEach(elements, sumOne, function(err, result) {
        expect(err).to.deep.equals(error);
        expect(result).to.deep.equals([2, 4]);
        expect(sumOne).to.have.callCount(3);
        done();
      });

    }
  );

});
