import test from 'tape';
import BaseModel from '..';

test('throws on duplicate names', t => {
  t.plan(1);

  class RegistryTestModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }
  }

  t.throws(
    () => {
      RegistryTestModel.register();
      RegistryTestModel.register();
    },
    /Model already registered: RegistryTestModel/,
    'throws with expected message'
  );
});

test('works with custom registry', t => {
  t.plan(1);

  const reg = new Map();

  class TestModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }
  }

  TestModel.register(reg);

  t.equal(reg.get('TestModel'), TestModel, 'registers the model by name');
});
