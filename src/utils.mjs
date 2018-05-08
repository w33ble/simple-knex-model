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
