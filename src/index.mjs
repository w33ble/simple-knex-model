import Ajv from 'ajv';
import { defineProp, getJoinQuery } from './utils.mjs';
import { ModelError, DocumentError, RelationshipError } from './errors.mjs';
import {
  JOIN_MAP,
  RELATIONSHIP_SCHEMA,
  HAS_ONE,
  HAS_MANY,
  BELONGS_TO,
  HAS_AND_BELONGS_TO_MANY,
} from './constants.mjs';

const modelRegistery = new Map();
const ajv = new Ajv();

export default class BaseModel {
  constructor(doc) {
    // validate model configuration
    const { valid, errors } = this.constructor.isValid;
    if (!valid) throw new ModelError(errors[0]);

    // register local properties
    defineProp(this, '$knex', { value: this.constructor.$knex });

    // keep the doc instance
    this.doc = doc;
    this.execHook = (method, ...args) => {
      if (typeof this.constructor[method] === 'function') return this.constructor[method](...args);
      return null;
    };

    this.execHook('onCreate', this.doc);
  }

  static get isValid() {
    const result = {
      valid: true,
      errors: [],
    };

    const addError = msg => {
      result.valid = false;
      result.errors.push(new ModelError(`Model failure, ${msg}: ${this.name}`));
    };

    // check for required definitions
    if (!/^[A-Z]/.test(this.name)) addError('Model class name should be capitalized');
    if (!/^[a-z]+$/i.test(this.name)) addError('Model class name should only contain letters');

    if (!this.tableName) addError('`tableName` is required');

    return result;
  }

  static validateRelationships() {
    const showError = msg => {
      throw new RelationshipError(`Relationship error in ${this.name}: ${msg}`);
    };

    // check model relationships
    if (!this.relationships) showError('no relationships defined');

    // check relationship definitions
    Object.keys(this.relationships).forEach(name => {
      const def = this.relationships[name];

      // validate the relationship schema
      if (!ajv.validate(RELATIONSHIP_SCHEMA, def)) {
        showError(`Invalid schema for \`${name}\`, ${ajv.errors[0].message.replace(/'/g, '`')}`);
      }

      // only a limited number of relationship types are supported
      if ([HAS_ONE, HAS_MANY, BELONGS_TO, HAS_AND_BELONGS_TO_MANY].indexOf(def.relation) < 0) {
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

  static get hasOne() {
    return HAS_ONE;
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
    if (this.registry.has(this.name))
      throw new ModelError(`Model already registered: ${this.name}`);
    this.registry.set(this.name, this);
  }

  static query() {
    return this.$knex.from(this.tableName);
  }

  static queryById(id) {
    return this.query().where({ [this.primaryKey]: id });
  }

  static queryWith(relations) {
    if (!this.$validRelationshipSchema) this.validateRelationships();
    defineProp(this, '$validateRelationships', { value: true });

    return (Array.isArray(relations) ? relations : [relations]).reduce((query, relation) => {
      const def = this.relationships[relation];
      const remoteModel = modelRegistery.get(def.model);

      if (!def) {
        throw new RelationshipError(`No relation defined from ${relation} in model ${this.name}`);
      }

      const joinFn = JOIN_MAP[def.joinType || 'inner'];

      return getJoinQuery({ query, joinFn, def, remoteModel, localModel: this });
    }, this.query());
  }

  static validate(data, schema) {
    const checkSchema = schema || this.jsonSchema;

    if (!ajv.validate({ ...checkSchema, type: 'object' }, data)) {
      return { valid: false, errors: ajv.errors };
    }

    return { valid: true, errors: [] };
  }

  async save() {
    const { jsonSchema, tableName, primaryKey, validate } = this.constructor;

    const schema = this.execHook('beforeValidate', { ...jsonSchema }, this.doc) || jsonSchema;

    if (schema) {
      const { valid, errors } = validate(this.doc, { ...schema, type: 'object' });

      if (!valid) {
        const { dataPath, message } = errors[0];
        const path = dataPath.length ? `\`${dataPath.replace(/^\./, '')}\` ` : '';

        throw new DocumentError(`document ${path}${message.replace(/'/g, '`')}`);
      }
    }

    this.execHook('beforeSave', this.doc);

    await this.$knex(tableName).insert(this.doc);

    return this.$knex(tableName)
      .where({ [primaryKey]: this.doc[primaryKey] })
      .first();
  }
}
