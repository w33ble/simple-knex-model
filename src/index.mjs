import Ajv from 'ajv';

const HAS_MANY = 'HAS_MANY';
const BELONGS_TO = 'BELONGS_TO';
const HAS_AND_BELONGS_TO_MANY = 'HAS_AND_BELONGS_TO_MANY';

const modelRegistery = new Map();
const ajv = new Ajv();

const joinMap = {
  inner: 'innerJoin',
  left: 'leftJoin',
  leftOuter: 'leftOuterJoin',
  right: 'rightJoin',
  rightOuter: 'rightOuterJoin',
  fullOuter: 'fullOuterJoin',
  cross: 'crossJoin',
};

const relationshipSchema = {
  type: 'object',
  required: ['model'],
  properties: {
    model: { type: 'string' },
    relation: { type: 'string', enum: [HAS_MANY, BELONGS_TO, HAS_AND_BELONGS_TO_MANY] },
    joinType: { type: 'string', enum: Object.keys(joinMap) },
    local: { type: 'string' },
    remote: { type: 'string' },
    joinTable: { type: 'string' },
    joinLocal: { type: 'string' },
    joinRemote: { type: 'string' },
  },
};

function defineProp(obj, prop, config = {}) {
  Object.defineProperty(obj, prop, {
    enumerable: false,
    writable: false,
    configurable: false,
    ...config,
  });
}

function executeOnDef(child, method, ...args) {
  if (typeof child[method] === 'function') return child[method](...args);
  return null;
}

export default class BaseModel {
  constructor(doc) {
    // validate model configuration
    const { valid, errors } = this.constructor.isValid;
    if (!valid) throw new Error(errors[0]);

    // register local properties
    defineProp(this, '$knex', { value: this.constructor.$knex });

    // keep the doc instance
    this.doc = doc;

    executeOnDef(this.constructor, 'onCreate', this.doc);
  }

  static get isValid() {
    const result = {
      valid: true,
      errors: [],
    };

    const addError = msg => {
      result.valid = false;
      result.errors.push(`Model failure, ${msg}: ${this.name}`);
    };

    // check for required definitions
    if (!this.tableName) addError('`tableName` is required');

    return result;
  }

  static validateRelationships() {
    const showError = msg => {
      throw new Error(`Relationship error in ${this.name}: ${msg}`);
    };

    // check model relationships
    if (!this.relationships) showError('no relationships defined');

    // check relationship definitions
    Object.keys(this.relationships).forEach(name => {
      const def = this.relationships[name];

      // validate the relationship schema
      if (!ajv.validate(relationshipSchema, def)) {
        showError(`Invalid schema for \`${name}\`, ${ajv.errors[0].message.replace(/'/g, '`')}`);
      }

      // only a limited number of relationship types are supported
      if ([HAS_MANY, BELONGS_TO, HAS_AND_BELONGS_TO_MANY].indexOf(def.relation) < 0) {
        showError(`Invalid relation for \`${name}\`, \`${def.relation}\` `);
      }

      // check that the model is actually in the registry
      if (!this.registry.has(def.model)) {
        showError(`Model \`${def.model}\` not in registry, for field \`${name}\` `);
      }
    });
  }

  static knex(value) {
    if (this.$knex) return;
    defineProp(this, '$knex', { value });
  }

  static get primaryKey() {
    return 'id';
  }

  static get hasMany() {
    return HAS_MANY;
  }

  static get belongsTo() {
    return BELONGS_TO;
  }

  static get belongsToMany() {
    return HAS_AND_BELONGS_TO_MANY;
  }

  static register(registry = modelRegistery) {
    // use optional external registry
    this.registry = registry;

    // keep track of the model
    if (this.registry.has(this.name)) throw new Error(`Model already registered: ${this.name}`);
    this.registry.set(this.name, this);
  }

  static query() {
    return this.$knex(this.tableName);
  }

  static queryWith(relations) {
    /*
    knex.select('*').from('users').join('accounts', {'accounts.id': 'users.account_id'})
    Outputs:
    select * from `users` inner join `accounts` on `accounts`.`id` = `users`.`account_id`
    */

    if (!this.validRelationshipSchema) this.validateRelationships();
    this.validRelationshipSchema = true;

    return (Array.isArray(relations) ? relations : [relations]).reduce((query, relation) => {
      const def = this.relationships[relation];
      const remoteModel = modelRegistery.get(def.model);

      if (!def) {
        throw new Error(`No relation defined from ${relation} in model ${this.name}`);
      }

      const joinFn = joinMap[def.joinType || 'inner'];

      if (def.relation === HAS_MANY) {
        // TODO: check that remote is defined in validateRelationships
        const left = `${remoteModel.tableName}.${def.remote}`;
        const right = `${this.tableName}.${def.local || this.primaryKey}`;
        return query[joinFn](remoteModel.tableName, { [left]: right });
      }

      if (def.relation === BELONGS_TO) {
        // TODO: check that local is defined in validateRelationships
        const left = `${this.tableName}.${def.local}`;
        const right = `${remoteModel.tableName}.${def.remote || remoteModel.primaryKey}`;
        return query[joinFn](remoteModel.tableName, { [left]: right });
      }

      if (def.relation === HAS_AND_BELONGS_TO_MANY) {
        // TODO: check that joinTable, joinLocal, and joinRemote are defined in validateRelationships
        const left = `${this.tableName}.${def.local || this.primaryKey}`;
        const leftJoin = `${def.joinTable}.${def.joinLocal}`;
        const right = `${remoteModel.tableName}.${def.remote || remoteModel.primaryKey}`;
        const rightJoin = `${def.joinTable}.${def.joinRemote}`;
        return query[joinFn](def.joinTable, { [left]: leftJoin })[joinFn](remoteModel.tableName, {
          [right]: rightJoin,
        });
      }

      throw new Error(`Unsupported relation type: ${def.relation}`);
    }, this.query());
  }

  static async byId(id, ...fields) {
    return this.query()
      .where({ [this.primaryKey]: id })
      .first(...fields);
  }

  async save() {
    const { jsonSchema, tableName, primaryKey } = this.constructor;

    const modifiedSchema = executeOnDef(
      this.constructor,
      'beforeValidate',
      { ...jsonSchema },
      this.doc
    );
    const schema = modifiedSchema || jsonSchema;

    if (schema) {
      const validate = ajv.compile({ ...schema, type: 'object' });
      const valid = validate(this.doc);
      if (!valid) {
        const { dataPath } = validate.errors[0];
        const path = dataPath.length ? `\`${dataPath.replace(/^\./, '')}\` ` : '';

        throw new Error(`document ${path}${validate.errors[0].message.replace(/'/g, '`')}`);
      }
    }

    executeOnDef(this.constructor, 'beforeSave', this.doc);

    await this.$knex(tableName).insert(this.doc);

    return this.$knex(tableName)
      .where({ [primaryKey]: this.doc[primaryKey] })
      .first();
  }
}
