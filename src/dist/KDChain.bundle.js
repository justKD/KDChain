/**
 * @file /src/dist/KDChain.bundle.js
 * @version 1.0.0
 * @author Cadence Holmes
 * @copyright Cadence Holmes 2020
 * @fileoverview
 * Building on the pipe concept, `KDChain` implements
 * functional composition for asynchronous use.
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
const KDWorker = (fn) => {
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
            /* eslint-disable-next-line no-eval */ if (prefix === 'function')
              return eval('(' + fnstr + ')');
            /* eslint-disable-next-line no-eval */ if (prefix === 'arrowfn')
              return eval(fnstr.slice(8));
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
    w.postMessage({ fn: cloneFn(fn), params: params });
    return await new Promise((resolve, reject) => {
      w.onmessage = (e) => resolve(e.data);
      w.onerror = (err) => reject(err);
      URL.revokeObjectURL(makeWebWorker);
    });
  };
};

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
const KDChain = (...fns) => {
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
          /* eslint-disable-next-line no-eval */ if (prefix === 'function')
            return eval(`(${fnstr})`);
          /* eslint-disable-next-line no-eval */ if (prefix === 'arrowfn')
            return eval(fnstr.slice(8));
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

const handleNonModule = function (exports) {
  exports.KDChain = KDChain;
};

const namespace = 'kd';
(function (declareExports) {
  const root = window;
  const rootDefine = root['define'];
  const amdRequire = root && typeof rootDefine === 'function' && rootDefine.amd;
  const esm = typeof module === 'object' && typeof exports === 'object';
  const nonmodule = root;

  /**
   * AMD / Require module
   * @example
   * ```
   *  require(["dist/KDChain.bundle.js"], function(KDChain) {
   *    console.log( KDChain );
   *  });
   * ```
   */
  if (amdRequire) {
    root['define'](['exports'], declareExports);
    return;
  }

  /**
   * CommonJS / ES / Node module
   * @example
   * ```
   *  import { KDChain } from "./dist/KDChain.bundle.js";
   *  console.log( KDChain );
   * ```
   */
  if (esm) {
    exports !== null && declareExports(exports);
    module !== null && (module.exports = exports);
    return;
  }

  /**
   * Non-module / CDN
   * @example
   * ```
   *  <script src="dist/KDChain.bundle.js"></script>
   *  <script>
   *    const KDChain = window.kd.KDChain;
   *    console.log( KDChain );
   *  </script>
   * ```
   */
  if (nonmodule) {
    declareExports((root[namespace] = root[namespace] || {}));
    return;
  }

  console.warn(
    'Unable to load as ES module. Use AMD, CJS, add an export, or use as non-module script.'
  );
})(handleNonModule);
