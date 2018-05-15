import { RelationshipError } from './errors.mjs';
import { HAS_ONE, HAS_MANY, BELONGS_TO, HAS_AND_BELONGS_TO_MANY } from './constants.mjs';

export const toSnakeCase = name =>
  name.trim().replace(/[A-Z]/g, (l, pos) => (pos === 0 ? l.toLowerCase() : `_${l.toLowerCase()}`));

export const toCamelCase = name =>
  `${name.charAt(0).toUpperCase()}${name
    .slice(1)
    .replace(/[\W_]+(.|$)/g, (l, m) => m.toUpperCase())}`;

export function defineProp(obj, prop, config = {}) {
  Object.defineProperty(obj, prop, {
    enumerable: false,
    writable: false,
    configurable: false,
    ...config,
  });
}

export function getJoinQuery({ query, joinFn, def, remoteModel, localModel }) {
  if (def.relation === HAS_MANY || def.relation === HAS_ONE) {
    const left = `${remoteModel.tableName}.${def.remote || `${toSnakeCase(localModel.name)}_id`}`;
    const right = `${localModel.tableName}.${def.local || localModel.primaryKey}`;
    return query[joinFn](remoteModel.tableName, { [left]: right });
  }

  if (def.relation === BELONGS_TO) {
    const left = `${localModel.tableName}.${def.local || `${toSnakeCase(remoteModel.name)}_id`}`;
    const right = `${remoteModel.tableName}.${def.remote || remoteModel.primaryKey}`;
    return query[joinFn](remoteModel.tableName, { [left]: right });
  }

  if (def.relation === HAS_AND_BELONGS_TO_MANY) {
    const joinTable =
      def.joinTable || [localModel.tableName, remoteModel.tableName].sort().join('_');

    const left = `${localModel.tableName}.${def.local || localModel.primaryKey}`;
    const leftJoin = `${joinTable}.${def.joinLocal || `${toSnakeCase(localModel.name)}_id`}`;
    const right = `${remoteModel.tableName}.${def.remote || remoteModel.primaryKey}`;
    const rightJoin = `${joinTable}.${def.joinRemote || `${toSnakeCase(remoteModel.name)}_id`}`;
    return query[joinFn](joinTable, { [left]: leftJoin })[joinFn](remoteModel.tableName, {
      [right]: rightJoin,
    });
  }

  throw new RelationshipError(`Unsupported relation type: ${def.relation}`);
}
