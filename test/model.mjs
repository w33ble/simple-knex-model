import test from 'tapped';
import knex from 'knex';
import BaseModel from '..';
import { ModelError } from '../src/errors.mjs';

test.setConcurrency(1);

const $k = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});

// const shouldReject = (t, fn, regex, msg = 'should reject') =>
//   fn().then(
//     () => t.fail('function should reject'),
//     e =>
//       t.throws(
//         () => {
//           throw e;
//         },
//         regex,
//         msg
//       )
//   );

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

// from here on down, order matters
test('db setup', async t => {
  BaseModel.knex($k);

  await $k.schema.createTable('users', table => {
    table.increments();
    table.string('name');
    table.timestamps();
  });

  t.pass('databaset setup complete');
});

test('validates on insert', async t => {
  t.plan(2);

  class User extends BaseModel {
    static get tableName() {
      return 'users';
    }

    static get jsonSchema() {
      return {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', maxLength: 12 },
        },
      };
    }
  }

  try {
    await User.query().insert({ name: 'some string that is too long' });
    t.fail('invalid documents should reject');
  } catch (err) {
    t.ok(
      /document `name` should NOT be longer than 12 characters/.test(err),
      'rejects with expected error'
    );
  }

  const [id] = await User.query().insert({ name: 'short string' });
  const row = await User.queryById(id).first();
  t.equal(row.name, 'short string', 'inserts valid record');
});

test('db teardown', async t => {
  await $k('users').truncate();
  t.pass('database teardown complete');
});
