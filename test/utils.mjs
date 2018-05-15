import test from 'tape';
import * as utils from '../src/utils.mjs';

test('toSnakeCase', t => {
  t.plan(3);
  t.equal(utils.toSnakeCase('Simple'), 'simple');
  t.equal(utils.toSnakeCase('SomeModel'), 'some_model');
  t.equal(utils.toSnakeCase('AModel'), 'a_model');
});

test('toCamelCase', t => {
  t.plan(3);
  t.equal(utils.toCamelCase('simple'), 'Simple');
  t.equal(utils.toCamelCase('some_model'), 'SomeModel');
  t.equal(utils.toCamelCase('a_model'), 'AModel');
});
