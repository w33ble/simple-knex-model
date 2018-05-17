import test from 'tapped';
import BaseModel from '..';

test('validate works without schema', t => {
  t.plan(4);

  class TestModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }

    static get jsonSchema() {
      return {
        properties: {
          name: { type: 'string' },
        },
      };
    }
  }

  let res = TestModel.validate({ name: 'example' });
  t.ok(res.valid, 'data is valid');
  t.equal(res.errors.length, 0, 'there are no errors');

  res = TestModel.validate({ name: 22 });
  t.notOk(res.valid, 'data is invalid');
  t.deepEqual(res.errors[0], {
    keyword: 'type',
    dataPath: '.name',
    schemaPath: '#/properties/name/type',
    params: { type: 'string' },
    message: 'should be string',
  });
});

test('validate works without model schema defined', t => {
  t.plan(4);

  class TestModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }
  }

  let res = TestModel.validate({ name: false });
  t.ok(res.valid, 'any data is valid');
  t.equal(res.errors.length, 0, 'there are no errors');

  res = TestModel.validate({ name: 22 });
  t.ok(res.valid, 'any data is valid');
  t.equal(res.errors.length, 0, 'there are no errors');
});

test('validate works with passed in schema', t => {
  t.plan(4);

  const schema = { properties: { name: { type: 'string' } } };

  class TestModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }
  }

  let res = TestModel.validate({ name: false }, schema);
  t.notOk(res.valid, 'data is invalid');
  t.deepEqual(res.errors[0], {
    keyword: 'type',
    dataPath: '.name',
    schemaPath: '#/properties/name/type',
    params: { type: 'string' },
    message: 'should be string',
  });

  res = TestModel.validate({ name: 'example' }, schema);
  t.ok(res.valid, 'any data is valid');
  t.equal(res.errors.length, 0, 'there are no errors');
});
