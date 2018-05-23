import suite from 'tapped';
import knex from 'knex';
import BaseModel from '..';
// import { ModelError } from '../src/errors.mjs';

const dbSetup = async () => {
  const $k = knex({
    client: 'sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true,
  });

  BaseModel.knex($k, true);

  return $k.schema.createTable('users', table => {
    table.increments();
    table.string('name');
    table.string('occupation');
    table.timestamps();
  });
};

// from here on down, order matters
suite('validates on insert', test => {
  test('db setup', async () => dbSetup());

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
      t.match(
        err.message,
        /document `name` should NOT be longer than 12 characters/,
        'rejects with expected error'
      );
    }

    const [id] = await User.query().insert({ name: 'short string' });
    const row = await User.queryById(id).first();
    t.equal(row.name, 'short string', 'inserts valid record');
  });
});

suite('validates on update', test => {
  test('db setup', async () => dbSetup());

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
          properties: { name: { type: 'string', maxLength: 12 } },
        };
      }
    }

    await User.query().insert({
      name: 'hello',
    });

    const row = await User.query().first();

    try {
      await User.query()
        .where({ id: row.id })
        .update({
          name: 'this string is entirely too long',
        });
      t.fail('update should throw on validation error');
    } catch (err) {
      t.match(
        err.message,
        /document `name` should NOT be longer than 12 characters/,
        'fails with expected error message'
      );
    }

    await User.query()
      .where({ id: row.id })
      .update({
        name: 'just right',
      });

    const updated = await User.queryById(row.id).first();

    t.equal(updated.name, 'just right', 'updates valid record');
  });
});

suite('beforeCreate hook', test => {
  test('db setup', async () => dbSetup());

  test('runs on insert', async t => {
    t.plan(3);
    let runCount = 0;

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
            occupation: { type: 'string' },
          },
        };
      }

      static beforeCreate(doc) {
        runCount += 1;
        doc.occupation = 'juggler'; // eslint-disable-line no-param-reassign
      }
    }

    await User.query().insert({ name: 'user' });
    const row = await User.query().first();

    t.equal(runCount, 1, 'beforeCreate was called');
    t.equal(row.name, 'user', 'document has expected name');
    t.equal(row.occupation, 'juggler', 'beforeCreate modifies document');
  });
});

suite('beforeUpdate hook', test => {
  test('db setup', async () => dbSetup());

  test('runs on insert', async t => {
    t.plan(3);
    let runCount = 0;

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
            occupation: { type: 'string' },
          },
        };
      }

      static beforeUpdate(doc) {
        runCount += 1;
        doc.occupation = 'juggler'; // eslint-disable-line no-param-reassign
      }
    }

    await User.query().insert({ name: 'user' });
    const row = await User.query().first();

    await User.query()
      .where({ id: row.id })
      .update({
        name: 'rad dude',
      });
    const updated = await User.query().first();

    t.equal(runCount, 1, 'beforeUpdate was called');
    t.equal(updated.name, 'rad dude', 'document has updated name');
    t.equal(updated.occupation, 'juggler', 'beforeUpdate modifies document');
  });
});
