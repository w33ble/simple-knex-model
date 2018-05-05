import Ajv from 'ajv';

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

  static async byId(id, ...fields) {
    return this.query()
      .where({ [this.primaryKey]: id })
      .first(...fields);
  }
}
