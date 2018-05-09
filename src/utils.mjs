import { HAS_MANY, BELONGS_TO, HAS_AND_BELONGS_TO_MANY } from './constants.mjs';

export function defineProp(obj, prop, config = {}) {
  Object.defineProperty(obj, prop, {
    enumerable: false,
    writable: false,
    configurable: false,
    ...config,
  });
}

export function executeOnDef(child, method, ...args) {
  if (typeof child[method] === 'function') return child[method](...args);
  return null;
}

export function getJoinQuery({ query, joinFn, def, remoteModel, localModel }) {
  if (def.relation === HAS_MANY) {
    // TODO: check that remote is defined in validateRelationships
    const left = `${remoteModel.tableName}.${def.remote}`;
    const right = `${localModel.tableName}.${def.local || localModel.primaryKey}`;
    return query[joinFn](remoteModel.tableName, { [left]: right });
  }

  if (def.relation === BELONGS_TO) {
    // TODO: check that local is defined in validateRelationships
    const left = `${localModel.tableName}.${def.local}`;
    const right = `${remoteModel.tableName}.${def.remote || remoteModel.primaryKey}`;
    return query[joinFn](remoteModel.tableName, { [left]: right });
  }

  if (def.relation === HAS_AND_BELONGS_TO_MANY) {
    // TODO: check that joinTable, joinLocal, and joinRemote are defined in validateRelationships
    const left = `${localModel.tableName}.${def.local || localModel.primaryKey}`;
    const leftJoin = `${def.joinTable}.${def.joinLocal}`;
    const right = `${remoteModel.tableName}.${def.remote || remoteModel.primaryKey}`;
    const rightJoin = `${def.joinTable}.${def.joinRemote}`;
    return query[joinFn](def.joinTable, { [left]: leftJoin })[joinFn](remoteModel.tableName, {
      [right]: rightJoin,
    });
  }

  throw new Error(`Unsupported relation type: ${def.relation}`);
}
