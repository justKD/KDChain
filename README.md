# KDChain

##### v 1.0.0 | © Cadence Holmes 2020 | MIT License

Building on the pipe concept, `KDChain` implements functional composition for asynchronous use.

`KDChain` uses my [`KDWorker`](https://github.com/justKD/KDWorker/tree/main/) to run the pipe
on a background thread. As such, functions passed to `KDChain` need to be web worker friendly.

[Fork on CodeSandbox](https://codesandbox.io/s/vibrant-austin-74req)

## Install

`src/dist/KDChain.bundle.js` can be added to your project in multiple ways:

```
// CommonJS / ES / Node module
// add to your module file

import { KDChain } from "KDChain.bundle.js";
console.log( KDChain );
```

```
// AMD / Require module
// add to your module file

require(["KDChain.bundle.js"], function(KDChain) {
  console.log( KDChain );
});
```

```
// Non-module / CDN
// add to your html file

<script src="KDChain.bundle.js"></script>
<script>
  const KDChain = window.kd.KDChain;
  console.log( KDChain );
</script>
```

## Basic Example

Provide a list of functions that will be run in order, passing the output from each to the next function in the list. The second set of parameters are the initial input to the first function. Access the results via a promise.

```
KDChain(f1, f2, f3)(x).then((res) => {
  console.log(res);
});
```

## Extended Example

Here's a longer example highlighting the async capability.

```
/**
 * We're going to use this blocking function to test `KDChain`.
 */
const blocker = (num) => {
  for (let i = 0; i < 5000; i++) Date.now();
  return ++num;
};

/**
  * Run an example using `KDChain` to compose functions asynchronously.
  */
const chainExample = () => {
  console.log('chain example');

  /**
   * So we can time how long these tests take.
   */
  const start = Date.now();

  /*
   * Here are three large but different-sized sets of chainable functions.
   */

  const sm = [...Array(1000)].fill(blocker);
  const md = [...Array(5000)].fill(blocker);
  const lg = [...Array(9000)].fill(blocker);

  /*
   * Now we run them in a different order to see that they are actually run asynchronously.
   * The output. The `sm` will finish first as expected, followed by the `md` set,
   * and finally the `lg` set.
   */

  KDChain(...lg)(3).then((res) => {
    console.log('chain lg', res);
    console.log(`done after ${Date.now() - start}ms`);
  });

  KDChain(...sm)(1).then((res) => {
    console.log('chain sm', res);
    console.log(`done after ${Date.now() - start}ms`);
  });

  KDChain(...md)(2).then((res) => {
    console.log('chain md', res);
    console.log(`done after ${Date.now() - start}ms`);
  });

  /*
   * Just some extra test examples.
   */

  const objTest = (x) => {
    return x.reduce((a, b) => a + b, 0);
  };

  KDChain(objTest)([...Array(1234)].fill(1)).then((res) => {
    console.log('chain objTest', res);
    console.log(`done after ${Date.now() - start}ms`);
  });

  const objTest2 = (x) => {
    const { prop } = x;
    return prop.length;
  };

  KDChain(objTest2)({ prop: 'prop' }).then((res) => {
    console.log('chain objTest2', res);
    console.log(`done after ${Date.now() - start}ms`);
  });
};
```
