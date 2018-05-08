import test from 'tape';
import BaseModel from '..';

test('throws without relationships', t => {
  t.plan(1);

  class TestModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }
  }

  t.throws(
    () => {
      TestModel.validateRelationships();
    },
    /Relationship error in TestModel: no relationships defined/,
    'has expected error message'
  );
});

test('throws on missing model', t => {
  t.plan(1);

  const reg = new Map();

  class MissingModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }

    static get relationships() {
      return {
        users: {},
      };
    }
  }

  MissingModel.register(reg);

  t.throws(
    () => {
      MissingModel.validateRelationships();
    },
    /Relationship error in MissingModel: Invalid schema for `users`, should have required property `model`/,
    'has expected error message'
  );
});

test('throws on invalid model', t => {
  t.plan(1);

  const reg = new Map();

  class FailingModelRelationship extends BaseModel {
    static get tableName() {
      return 'test_table';
    }

    static get relationships() {
      return {
        users: {
          model: 'Nope',
          relation: BaseModel.belongsTo,
        },
      };
    }
  }

  FailingModelRelationship.register(reg);

  t.throws(
    () => {
      FailingModelRelationship.validateRelationships();
    },
    /Relationship error in FailingModelRelationship: Model `Nope` not in registry, for field `users`/,
    'has expected error message'
  );
});

test('throws on missing relation type', t => {
  t.plan(1);

  const reg = new Map();

  class ValidModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }
  }

  class InvalidRelation extends BaseModel {
    static get tableName() {
      return 'test_table2';
    }

    static get relationships() {
      return {
        valid: {
          model: 'ValidModel',
          relation: 'cats',
        },
      };
    }
  }

  ValidModel.register(reg);
  InvalidRelation.register(reg);

  t.throws(
    () => {
      InvalidRelation.validateRelationships();
    },
    /Relationship error in InvalidRelation: Invalid schema for `valid`, should be equal to one of the allowed values/,
    'has expected error message'
  );
});

test('valid relationship', t => {
  t.plan(1);

  const reg = new Map();

  class ValidModel extends BaseModel {
    static get tableName() {
      return 'test_table';
    }
  }

  class ValidRelation extends BaseModel {
    static get tableName() {
      return 'test_table2';
    }

    static get relationships() {
      return {
        valid: {
          model: 'ValidModel',
          relation: BaseModel.hasMany,
        },
      };
    }
  }

  ValidModel.register(reg);
  ValidRelation.register(reg);

  t.doesNotThrow(() => {
    ValidRelation.validateRelationships();
  });
});
