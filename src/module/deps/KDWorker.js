/**
 * @file /src/module/KDWorker.js
 * @version 1.1.0
 * @author Cadence Holmes
 * @copyright Cadence Holmes 2020
 * @license MIT
 * @fileoverview
 * `KDWorker` creates web workers on the fly. Simply pass the web worker function and its parameter to
 * `KDWorker`, and it will build the web worker script, add it to the DOM and run the web worker,
 * and revoke the DOMString when finished.
 */

/**
 * `KDWorker` creates web workers on the fly. Simply pass the web worker function and its parameter to
 * `KDWorker`, and it will build the web worker script, add it to the DOM and run the web worker,
 * and revoke the DOMString when finished.
 * @param fn - This should be a web worker friendly function intended to be run on the web worker.
 * @example
 * ```
 *  KDWorker((x) => {
 *    return `from worker - ${x}`;
 *  })("hello")
 *    .then(console.log)
 *    .catch(console.log);
 * ```
 */
export const KDWorker = (fn) => {
  /**
   * `KDWorker` returns an async function which in turn returns a promise that resolves on worker completion.
   * @param params - This should be the parameters that would be passed to the web worker function.
   */
  return async (params) => {
    const isFn = (fn) => {
      if (fn === undefined || fn === null) return;
      return Object.prototype.toString.call(fn) === '[object Function]';
    };
    if (!isFn(fn)) return fn;
    const work = () => {
      onmessage = function (e) {
        const parseClone = (str) => {
          return JSON.parse(str, function (_, fnstr) {
            if (typeof fnstr !== 'string') return fnstr;
            if (fnstr.length < 8) return fnstr;
            const prefix = fnstr.substring(0, 8);
            /* eslint-disable-next-line no-eval */
            if (prefix === 'function') return eval('(' + fnstr + ')');
            /* eslint-disable-next-line no-eval */
            if (prefix === 'arrowfn') return eval(fnstr.slice(8));
            return fnstr;
          });
        };
        const res = parseClone(e.data.fn)(e.data.params);
        /* eslint-disable-next-line no-restricted-globals */
        self.postMessage(res, null);
      };
    };
    const makeWebWorker = (() => {
      let script = work.toString();
      script = script.substring(
        script.indexOf('{') + 1,
        script.lastIndexOf('}')
      );
      const blob = new Blob([script], { type: 'application/javascript' });
      return URL.createObjectURL(blob);
    })();
    const w = new Worker(makeWebWorker);
    const cloneFn = function (obj) {
      return JSON.stringify(obj, function (_, fn) {
        if (!isFn(fn)) return fn;
        const fnstr = fn.toString();
        return fnstr.substring(0, 8) !== 'function' ? `arrowfn${fnstr}` : fnstr;
      });
    };
    w.postMessage({
      fn: cloneFn(fn),
      params: params,
    });
    return await new Promise((resolve, reject) => {
      w.onmessage = (e) => resolve(e.data);
      w.onerror = (err) => reject(err);
      URL.revokeObjectURL(makeWebWorker);
    });
  };
};
