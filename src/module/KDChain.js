/**
 * @file /src/module/KDChain.js
 * @version 1.0.0
 * @author Cadence Holmes
 * @copyright Cadence Holmes 2020
 * @fileoverview
 * Building on the pipe concept, `KDChain` implements
 * functional composition for asynchronous use.
 */

import { KDWorker } from './deps/KDWorker';

/**
 * Building on the pipe concept, `KDChain` implements
 * functional composition for asynchronous use.
 * @param fns - The functions to chain, in order first to last. The
 * output from each will be passed to the next function in the list.
 * @param x - The initial parameter to pass to the first function.
 * @example
 * ```
 *  KDChain(f1, f2, f3)(x).then((res) => {
 *    console.log(res);
 *  });
 * ```
 */
export const KDChain = (...fns) => {
  return async (x) => {
    const isFn = (fn) => {
      if (fn === undefined || fn === null) return;
      return Object.prototype.toString.call(fn) === '[object Function]';
    };
    const cloneFn = function (obj) {
      return JSON.stringify(obj, function (_, fn) {
        if (!isFn(fn)) return fn;
        const fnstr = fn.toString();
        return fnstr.substring(0, 8) !== 'function' ? `arrowfn${fnstr}` : fnstr;
      });
    };
    const clonedFns = [];
    fns.forEach((fn) => clonedFns.push(cloneFn(fn)));
    return await KDWorker((y) => {
      const param = y[0];
      const clonedFns = y[1];
      const parseClone = (str) => {
        return JSON.parse(str, function (_, fnstr) {
          if (typeof fnstr !== 'string') return fnstr;
          if (fnstr.length < 8) return fnstr;
          const prefix = fnstr.substring(0, 8);
          /* eslint-disable-next-line no-eval */
          if (prefix === 'function') return eval(`(${fnstr})`);
          /* eslint-disable-next-line no-eval */
          if (prefix === 'arrowfn') return eval(fnstr.slice(8));
          return fnstr;
        });
      };
      const fns = [];
      clonedFns.forEach((clonedFn) => {
        if (typeof clonedFn === 'string') {
          const fn = parseClone(clonedFn);
          fns.push(fn);
        }
      });
      const pipe = (...fns) => (x) => {
        return fns.reduce((v, f) => f(v), x);
      };
      return pipe(...fns)(param);
    })([x, clonedFns]);
  };
};
