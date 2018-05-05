import Ajv from 'ajv';

const ajv = new Ajv();
// const modelRegistery = new Map(); // TODO: mapping relationships

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

  if (!child.tableName) showError('`tableName` is required');
}

export default class BaseModel {
  constructor(doc = {}) {
    validateModel(this.constructor);
    // modelRegistery.set(this.constructor.name, this.constructor); // TODO: mapping relationships
    defineProp(this, '$knex', { value: this.constructor.$knex });

    this.doc = doc;
  }

  get primaryKey() {
    return this.constructor.primaryKey || 'id';
  }

  async save() {
    const schema = this.constructor.jsonSchema;

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

  static query() {
    return this.$knex(this.tableName);
  }

  static async byId(id, ...fields) {
    return this.query()
      .where({ [this.primaryKey]: id })
      .first(...fields);
  }
}
