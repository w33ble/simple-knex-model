import test from 'tape';
import BaseModel from '..';
import { ModelError, DocumentError } from '../src/errors.mjs';

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

test('save validates', t => {
  t.plan(7);

  class SaveModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }

    static get jsonSchema() {
      return {
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 6 },
          email: { type: 'string', format: 'email' },
        },
      };
    }
  }

  Promise.resolve()
    .then(() => {
      const user = new SaveModel({
        email: 'mail@email.co',
      });

      return user
        .save()
        .then(() => t.fail('save should reject'))
        .catch(err => {
          t.ok(err instanceof DocumentError, 'error is a DocumentError');
          t.equal(err.message, 'document should have required property `name`');
        });
    })
    .then(() => {
      const user = new SaveModel({
        name: 'boots',
        email: 'mail@email.co',
      });

      return user
        .save()
        .then(() => t.fail('save should reject'))
        .catch(err => {
          t.ok(err instanceof DocumentError, 'error is a DocumentError');
          t.equal(err.message, 'document `name` should NOT be shorter than 6 characters');
        });
    })
    .then(() => {
      const user = new SaveModel({
        name: 'boots and cats',
        email: 'mail',
      });

      return user
        .save()
        .then(() => t.fail('save should reject'))
        .catch(err => {
          t.ok(err instanceof DocumentError, 'error is a DocumentError');
          t.equal(err.message, 'document `email` should match format "email"');
        });
    })
    .then(() => {
      const user = new SaveModel({
        name: 'boots and cats',
        email: 'mail@email.co',
      });

      return user
        .save()
        .then(() => t.fail('save should reject'))
        .catch(err => {
          // this failure means validation passed, but we haven't set up knex
          t.equal(err.message, 'this.$knex is not a function');
        });
    })
    .catch(err => t.error(err));
});
