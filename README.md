# simple-knex-model

A simple model for knex queries.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/w33ble/simple-knex-model/master/LICENSE)
[![npm](https://img.shields.io/npm/v/simple-knex-model.svg)](https://www.npmjs.com/package/simple-knex-model)
[![Project Status](https://img.shields.io/badge/status-experimental-orange.svg)](https://nodejs.org/api/documentation.html#documentation_stability_index)

## Features

- ✅ Fully es6 module compatible
- ✅ Schema validation using [ajv](https://www.npmjs.com/package/ajv)
- ✅ [Extensible via hooks](#user-content-adding-functionality)
- ✅ Model registry for relationships, no circular dependencies

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

## API

`Model` here is your model, which extends `BaseModel` (simple-knex-model);

#### `new Model(document)`

Creates a new instance of the model, ready to be saved. Document is an object.

#### `modelInstance.save()`

Inserts the document into the database. Returns a promise. If `jsonSchema` is defined on the model, it will be used to validate the document before saving, and the Promise will reject if the validation fails.

#### `Model.byId(id, ...fields)`

Fetches a record by id from the database. Returns a Promise that resolves to the single matching record. If fields are provided, only those fields will be returned, otherwise all fields will be returned.

#### `Model.query()`

Returns an instance of `knex`, with the table name already applied. Use this to execute any of the normal `knex` operations.

#### `Model.queryWith(relations)`

`relations` is either a key from the relationships object or an array of said keys. Returns an instance of `knex`, with the table name already applied and the related join queries applied. Use this to execute any of the normal `knex` operations with your defined joins.

## Relationships

Basic relationships are supported, using `BaseModel.hasMany`, `BaseModel.belongsTo`, and `BaseModel.belongsToMany`. The naming should be pretty self-explanatory, but there is plenty of information around that explains how it works. Here's a quick example:

```js
import BaseModel from 'simple-knex-model';

class Chef extends BaseModel {
  static get tableName() {
    return 'chefs';
  }

  static get relationships() {
    return {
      recipes: {
        model: 'Recipe',
        relation: BaseModel.hasMany,
        remote: 'chef_id',
      }
    };
  }
}

class Recipe extends BaseModel {
  static get tableName() {
    return 'recipes';
  }

  static get relationships() {
    return {
      chef: {
        model: 'Chef',
        relation: BaseModel.belongsTo,
        local: 'chef_id',
      }
    };
  }
}

// get all recipes and include the chef's name in the joined results
await results = Recipe.queryWith('recipes').select('chefs.name as chef', 'recipes.*');
```

Here's the breakdown of the options for each. If you need something more complex, you'll have to craft if by hand directly from the `knex` instance.

#### `BaseModel.hasMany`

Owner model has many child models

property | default | description
-------- | ------- | ----------- 
model | | `string` - Model name to join with
relation | | `BaseModel.hasMany` - The model relationship type
joinType | `inner` | `string` - The join type to use (inner, left, right, leftOuter, rightOuter, fullOuter, cross)
local | primaryKey | `string` - The local field to join with
remote | | `string` - The remote field to join with

#### `BaseModel.belongsTo`

Owner model belongs to child model

property | default | description
-------- | ------- | ----------- 
model | | `string` - Model name to join with
relation | | `BaseModel.belongsTo` - The model relationship type
joinType | `inner` | `string` - The join type to use (inner, left, right, leftOuter, rightOuter, fullOuter, cross)
local | | `string` - The local field to join with
remote | primaryKey | `string` - The remote field to join with

#### `BaseModel.belongsToMany`

Owner model has and belongs to many child models, coordinated through a join table

property | default | description
-------- | ------- | ----------- 
model | | `string` - Model name to join with
relation | | `BaseModel.belongsToMany` - The model relationship type
joinType | `inner` | `string` - The join type to use (inner, left, right, leftOuter, rightOuter, fullOuter, cross)
joinTable | | `string` - Table join table to use
local | primaryKey | `string` - The local field to join with
joinLocal | | `string` - The field in the join table to match on the local field
remote | primaryKey | `string` - The remote field to join with
joinRemote | | `string` - The field in the join table to match on the remote field

## Adding Functionality

`simple-knex-model` provides 3 hooks which can be used to modify data on the fly. You can use that to create your own custom base model, or even to write plugins. For example, let's say you want to apply a custom id to documents, via uuid or some other method, you can use the `onCreate` hook to do just that.

```js
import BaseModel from 'simple-knex-model';
import crypto from 'crypto';

const rand = len => crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);

class User extends BaseModel {
  static get tableName() {
    return 'users';
  }

  static onCreate(doc) {
    doc.id = rand(12);
  }
}

const user = new User({ email: 'user@email.co' }); 
console.log(user); // { id: 'daa92600af5d', email: 'user@email.co' }
```

Now every User document you create will have a random id. You could plug any GUID/UUID functionality you want in here. You can also take this idea further and create your own custom base class that adds this functionality to every model that extends it.

```js
import BaseModel from 'simple-knex-model';
import crypto from 'crypto';

const rand = len => crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);

class CustomModel extends BaseModel {
  static onCreate(doc) {
    doc.id = rand(12);
  }
}

class User extends CustomModel {
  static get tableName() {
    return 'users';
  }
}

class Post extends CustomModel {
  static get tableName() {
    return 'posts';
  }
}

const user = new User({ email: 'user@email.co' }); 
const post = new Post({ title: 'Hello World' });
console.log(user); // { id: 'b8919bf858ab', email: 'user@email.co' }
console.log(post): // { id: 'f624c9ad373c', title: 'Hello World' }
```

## Hooks

#### `onCreate(doc)`

Called when a new instance of the model is created. The `doc` object is passed by reference and can be mutated directly.

#### `beforeValidate(jsonSchema, doc)`

Called before the doc is validated against the defined schema. `jsonSchema` is a shallow clone of the schema defined on the model, and anything returned from this function will be used as the new schema. The `doc` object is passed by reference and can be mutated directly.

#### `beforeSave(doc)`

Called after the validation but before the document is written to the database. The `doc` object is passed by reference and can be mutated directly.

#### License

MIT © [w33ble](https://github.com/w33ble)