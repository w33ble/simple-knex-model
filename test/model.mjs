import test from 'tapped';
import BaseModel from '..';
import { ModelError } from '../src/errors.mjs';

test('invalid without table name', t => {
  t.plan(4);

  class InvalidModel extends BaseModel {}
  const { valid, errors } = InvalidModel.isValid;

  t.notOk(valid, 'is invalid');
  t.ok(errors.length >= 1, 'has at least 1 error');
  t.ok(errors[0] instanceof ModelError, 'is a model error');
  t.equal(
    errors[0].message,
    'Model failure, `tableName` is required: InvalidModel',
    'fails on tableName'
  );
});

test('invalid with incorrect name', t => {
  t.plan(4);

  class invalidModel extends BaseModel {}
  const { valid, errors } = invalidModel.isValid;

  t.notOk(valid, 'is invalid');
  t.ok(errors.length >= 1, 'has at least 1 error');
  t.ok(errors[0] instanceof ModelError, 'is a model error');
  t.equal(errors[0].message, 'Model failure, Model class name should be capitalized: invalidModel');
});

test('invalid with incorrect name', t => {
  t.plan(4);

  // eslint-disable-next-line camelcase
  class Invalid_Model extends BaseModel {}
  const { valid, errors } = Invalid_Model.isValid;

  t.notOk(valid, 'is invalid');
  t.ok(errors.length >= 1, 'has at least 1 error');
  t.ok(errors[0] instanceof ModelError, 'is a model error');
  t.equal(
    errors[0].message,
    'Model failure, Model class name should only contain letters: Invalid_Model'
  );
});

test('valid with only name', t => {
  t.plan(2);

  class TestModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }
  }
  const { valid, errors } = TestModel.isValid;

  t.ok(valid, 'valid model');
  t.ok(errors.length === 0, 'no error');
});
