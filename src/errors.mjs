import { defineProp } from './utils.mjs';

class CustomError extends Error {
  constructor(message = '', ...args) {
    super(message, ...args);

    defineProp(this, 'message', {
      value: message,
      configurable: true,
      writable: true,
    });

    defineProp(this, 'name', {
      value: this.constructor.name,
      configurable: true,
      writable: true,
    });

    if (Object.hasOwnProperty.call(Error, 'captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      const temp = Error.call(this, message, ...args);
      defineProp(this, 'stack', {
        get: () => temp.stack,
        configurable: true,
      });
    }
  }
}

export class ModelError extends CustomError {}

export class DocumentError extends CustomError {}

export class RelationshipError extends CustomError {}
