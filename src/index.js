import { KDChain } from './module/KDChain.js';

/**
 * Example
 */
(() => {
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
    console.log();
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

  /**
   * A counter example using synchrounous piping that will block the main thread.
   */
  const pipeExample = () => {
    console.log();
    console.log('pipe example');
    console.log('blocking UI - about 5 seconds');

    const pipe = (...fns) => (x) => {
      return fns.reduce((v, f) => f(v), x);
    };

    const sm = [...Array(100)].fill(blocker);
    const md = [...Array(5000)].fill(blocker);
    const lg = [...Array(10000)].fill(blocker);

    setTimeout(() => {
      console.log('pipe lg', pipe(...lg)(0));
      console.log('pipe sm', pipe(...sm)(0));
      console.log('pipe md', pipe(...md)(0));
    }, 100);
  };

  /**
   * Just creating UI elements to run the tests.
   */

  const divider = () => {
    const div = document.createElement('div');
    div.style.width = '50px';
    div.style.height = '10px';
    document.body.appendChild(div);
  };

  const chainTest = () => {
    const button = document.createElement('input');
    button.id = 'chain-use-worker';
    button.type = 'button';
    button.value = 'chain - use worker';
    button.onclick = () => chainExample();
    document.body.appendChild(button);
  };

  const pipeTest = () => {
    const button = document.createElement('input');
    button.id = 'pipe-block-ui';
    button.type = 'button';
    button.value = 'pipe - block ui';
    button.onclick = () => pipeExample();
    document.body.appendChild(button);
  };

  divider();
  chainTest();
  pipeTest();
})();
