import Ajv from 'ajv';

const HAS_MANY = 'HAS_MANY';
const BELONGS_TO = 'BELONGS_TO';
// const HAS_AND_BELONGS_TO_MANY = 'HAS_AND_BELONGS_TO_MANY';

const modelRegistery = new Map();
const ajv = new Ajv();

function defineProp(obj, prop, config = {}) {
  Object.defineProperty(obj, prop, {
    enumerable: false,
    writable: false,
    configurable: false,
    ...config,
  });
}

function validateModel(child) {
  function showError(msg) {
    throw new Error(`Model failure, ${msg}: ${child.name}`);
  }

  // check for required definitions
  if (!child.tableName) showError('`tableName` is required');
}

function validateRelationships(child, registry) {
  function showError(msg, name) {
    const err = `Relationship failure, ${msg}: ${child.name}`;
    if (name) throw new Error(`${err} (relation \`${name}\`)`);
    throw new Error(err);
  }

  if (!child.relationships) showError('Model has no relationships defined');

  // check relationship definitions
  if (child.relationships) {
    Object.keys(child.relationships).forEach(name => {
      const def = child.relationships[name];

      // only a limited number of relationship types are supported
      if ([HAS_MANY, BELONGS_TO].indexOf(def.relation) < 0)
        showError(`Invalid relation type \`${def.relation}\``, name);

      if (!registry.has(def.model)) showError(`Model \`${def.model}\` not in registry`, name);
    });
  }
}

function execute(child, method, ...args) {
  if (typeof child[method] === 'function') return child[method](...args);
  return null;
}

const joinMap = {
  inner: 'innerJoin',
  left: 'leftJoin',
  leftOuter: 'leftOuterJoin',
  right: 'rightJoin',
  rightOuter: 'rightOuterJoin',
  fullOuter: 'fullOuterJoin',
  cross: 'crossJoin',
};

export default class BaseModel {
  constructor(doc = {}) {
    // validate model configuration
    validateModel(this.constructor);

    // register local properties
    defineProp(this, '$knex', { value: this.constructor.$knex });

    // keep the doc instance
    this.doc = doc;

    execute(this.constructor, 'onCreate', this.doc);
  }

  get primaryKey() {
    // default primary key
    return this.constructor.primaryKey || 'id';
  }

  async save() {
    const jsonSchema = this.constructor.jsonSchema; // eslint-disable-line prefer-destructuring
    const modifiedSchema = execute(this.constructor, 'beforeValidate', { ...jsonSchema }, this.doc);
    const schema = modifiedSchema || jsonSchema;

    if (schema) {
      const validate = ajv.compile(schema);
      const valid = validate(this.doc);
      if (!valid) {
        // console.error(validate.errors); // TODO: proper error logger
        throw new Error(
          `document '${validate.errors[0].dataPath.replace(/^\./, '')}' ${
            validate.errors[0].message
          }`
        );
      }
    }

    execute(this.constructor, 'beforeSave', this.doc);

    await this.$knex(this.constructor.tableName).insert(this.doc);

    return this.$knex(this.constructor.tableName)
      .where({ [this.primaryKey]: this.doc[this.primaryKey] })
      .first();
  }

  static knex(value) {
    if (this.$knex) return;
    defineProp(this, '$knex', { value });
  }

  static get primaryKey() {
    return 'id';
  }

  static register(registry = modelRegistery) {
    // keep track of the model
    if (registry.has(this.name)) throw new Error(`Model already registered: ${this.name}`);
    registry.set(this.name, this);
  }

  static query() {
    return this.$knex(this.tableName);
  }

  static queryWith(relations, registry = modelRegistery) {
    /*
    knex.select('*').from('users').join('accounts', {'accounts.id': 'users.account_id'})
    Outputs:
    select * from `users` inner join `accounts` on `accounts`.`id` = `users`.`account_id`
    */

    validateRelationships(this, registry);

    return (Array.isArray(relations) ? relations : [relations]).reduce((query, relation) => {
      const def = this.relationships[relation];
      const leftModel = modelRegistery.get(def.model);

      if (!def) {
        throw new Error(`No relation defined from ${relation} in model ${this.name}`);
      }

      const joinFn = joinMap[def.type || 'inner'];

      if (def.relation === HAS_MANY) {
        const left = `${leftModel.tableName}.${def.remote}`;
        const right = `${this.tableName}.${def.local || this.primaryKey}`;
        return query[joinFn](leftModel.tableName, { [left]: right });
      }

      if (def.relation === BELONGS_TO) {
        const left = `${this.tableName}.${def.local}`;
        const right = `${leftModel.tableName}.${def.remote || leftModel.primaryKey}`;
        return query[joinFn](leftModel.tableName, { [left]: right });
      }

      throw new Error(`Unsupported relation type: ${def.relation}`);
    }, this.query());
  }

  static async byId(id, ...fields) {
    return this.query()
      .where({ [this.primaryKey]: id })
      .first(...fields);
  }

  static get hasMany() {
    return HAS_MANY;
  }

  static get belongsTo() {
    return BELONGS_TO;
  }

  // static get hasAndBelongsToMany() {
  //   return HAS_AND_BELONGS_TO_MANY;
  // }
}
