# simple-knex-model

A simple model for knex queries.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/w33ble/simple-knex-model/master/LICENSE)
[![npm](https://img.shields.io/npm/v/simple-knex-model.svg)](https://www.npmjs.com/package/simple-knex-model)
[![Project Status](https://img.shields.io/badge/status-experimental-orange.svg)](https://nodejs.org/api/documentation.html#documentation_stability_index)

## Features

- ✅ Fully es6 module compatilble
- ✅ Schema validation using [ajv](https://www.npmjs.com/package/ajv)
- ⁉️ Model registry for relationships, no circular dependencies
- ⁉️ Pluggable

Inspired a bit by [objection](https://www.npmjs.com/package/objection), but with *way* less features. On the plus side, it works with es6 modules.

## Usage

```
yarn add simple-knex-model knex
# or npm install --save simple-knex-model knex
```

Configure your knex instance and provide it to the base model. This can be done any time before you use a model instance, and subsequent calls are safe.

```js
import BaseModel from 'simple-knex-model';
import knex from 'knex';

const knexConfig = {};
const db = knex(knexConfig);

BaseModel.knex(db);
```

Then define your models.

```js
import BaseModel from 'simple-knex-model';

export default class User extends BaseModel {
  static get tableName() { // required
    return 'users';
  }

  static get primaryKey() { // optional
    return 'id'; // default value
  }

  static get jsonSchema() { // optional
    return {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        status: { type: 'string', enum: ['pending', 'approved', 'denied'] },
      },
    };
  }
}
```

If you provide a `jsonSchema`, documents will be validated with it before they are saved.

### API

`Model` here is your model, which extends `BaseModel` (simple-knex-model);

#### `new Model(document)`

Creates a new instance of the model, ready to be saved. Document is an object.

#### `modelInstance.save()`

Inserts the document into the database. Returns a promise. If `jsonSchema` is defined on the model, it will be used to validate the document before saving, and the Promise will reject if the validation fails.

#### `Model.byId(id, ...fields)`

Fetches a record by id from the database. Returns a Promise that resolves to the single matching record. If fields are provided, only those fields will be returned, otherwise all fields will be returned.

#### `Model.query()`

Returns an instance of `knex`, with the table name already applied. Use this to execute any of the normal `knex` operations.

#### License

MIT © [w33ble](https://github.com/w33ble)