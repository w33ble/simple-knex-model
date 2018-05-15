export const HAS_ONE = 'HAS_ONE';
export const HAS_MANY = 'HAS_MANY';
export const BELONGS_TO = 'BELONGS_TO';
export const HAS_AND_BELONGS_TO_MANY = 'HAS_AND_BELONGS_TO_MANY';

export const JOIN_MAP = {
  inner: 'innerJoin',
  left: 'leftJoin',
  leftOuter: 'leftOuterJoin',
  right: 'rightJoin',
  rightOuter: 'rightOuterJoin',
  fullOuter: 'fullOuterJoin',
  cross: 'crossJoin',
};

export const RELATIONSHIP_SCHEMA = {
  type: 'object',
  required: ['model'],
  properties: {
    model: { type: 'string' },
    relation: { type: 'string', enum: [HAS_ONE, HAS_MANY, BELONGS_TO, HAS_AND_BELONGS_TO_MANY] },
    joinType: { type: 'string', enum: Object.keys(JOIN_MAP) },
    local: { type: 'string' },
    remote: { type: 'string' },
    joinTable: { type: 'string' },
    joinLocal: { type: 'string' },
    joinRemote: { type: 'string' },
  },
};
