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

export class DocumentError extends CustomError {
  constructor(errors) {
    const error = Array.isArray(errors) ? errors[0] : errors;

    const { dataPath, message } = error;
    const path = dataPath.length ? `\`${dataPath.replace(/^\./, '')}\` ` : '';
    const errMessage = `document ${path}${message.replace(/'/g, '`')}`;

    super(errMessage);
    this.message = errMessage;
    this.allErrors = errors;
  }
}

export class RelationshipError extends CustomError {}
