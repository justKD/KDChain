/**
 * @file /src/module/dev/KDChain.ts
 * @version 1.0.0
 * @author Cadence Holmes
 * @copyright Cadence Holmes 2020
 * @fileoverview
 * Building on the pipe concept, `KDChain` implements
 * functional composition for asynchronous use.
 */

import { KDWorker } from '../deps/KDWorker';

type GenericFunc<T extends any[], R = any> = (...args: T) => R | void;
type UnknownFunc = GenericFunc<unknown[], unknown>;

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
export const KDChain = (...fns: UnknownFunc[]) => {
  return async (x: any) => {
    const isFn = (fn: any) => {
      if (fn === undefined || fn === null) return;
      return Object.prototype.toString.call(fn) === '[object Function]';
    };

    const cloneFn = function (obj: any) {
      return JSON.stringify(obj, function (_, fn) {
        if (!isFn(fn)) return fn;
        const fnstr = fn.toString();
        return fnstr.substring(0, 8) !== 'function' ? `arrowfn${fnstr}` : fnstr;
      });
    };

    const clonedFns = [];

    fns.forEach((fn) => clonedFns.push(cloneFn(fn)));

    return await KDWorker((y: any) => {
      const param = y[0];
      const clonedFns = y[1];

      const parseClone = (str: string) => {
        return JSON.parse(str, function (_, fnstr: string) {
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

      clonedFns.forEach((clonedFn: string) => {
        if (typeof clonedFn === 'string') {
          const fn = parseClone(clonedFn);
          fns.push(fn);
        }
      });

      const pipe = (...fns: UnknownFunc[]) => (x: any) => {
        return fns.reduce((v: any, f: UnknownFunc) => f(v), x);
      };

      return pipe(...fns)(param);
    })([x, clonedFns]);
  };
};
