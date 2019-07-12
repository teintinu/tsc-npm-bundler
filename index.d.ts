declare const describe: Describe
declare const it: It
declare const expect: Expect

/**
 * Creates a test closure
 */
interface It {
  /**
   * Creates a test closure.
   *
   * @param name The name of your test
   * @param fn The function for your test
   * @param timeout The timeout for an async function test
   */
  (name: string, fn?: ProvidesCallback, timeout?: number): void;
  /**
   * Only runs this test in the current file.
   */
  only: It;
  /**
   * Skips running this test in the current file.
   */
  skip: It;
  /**
   * Sketch out which tests to write in the future.
   */
  todo: It;
  /**
   * Experimental and should be avoided.
   */
  concurrent: It;
  /**
   * Use if you keep duplicating the same test with different data. `.each` allows you to write the
   * test once and pass data in.
   *
   * `.each` is available with two APIs:
   *
   * #### 1  `test.each(table)(name, fn)`
   *
   * - `table`: Array of Arrays with the arguments that are passed into the test fn for each row.
   * - `name`: String the title of the test block.
   * - `fn`: Function the test to be ran, this is the function that will receive the parameters in each row as function arguments.
   *
   *
   * #### 2  `test.each table(name, fn)`
   *
   * - `table`: Tagged Template Literal
   * - `name`: String the title of the test, use `$variable` to inject test data into the test title from the tagged template expressions.
   * - `fn`: Function the test to be ran, this is the function that will receive the test data object..
   *
   * @example
   *
   * // API 1
   * test.each([[1, 1, 2], [1, 2, 3], [2, 1, 3]])(
   *   '.add(%i, %i)',
   *   (a, b, expected) => {
   *     expect(a + b).toBe(expected);
   *   },
   * );
   *
   * // API 2
   * test.each`
   * a    | b    | expected
   * ${1} | ${1} | ${2}
   * ${1} | ${2} | ${3}
   * ${2} | ${1} | ${3}
   * `('returns $expected when $a is added $b', ({a, b, expected}) => {
   *    expect(a + b).toBe(expected);
   * });
   *
   */
  each: Each;
}

interface Describe {
  // tslint:disable-next-line ban-types
  (name: number | string | Function | FunctionLike, fn: EmptyFunction): void;
  /** Only runs the tests inside this `describe` for the current file */
  only: Describe;
  /** Skips running the tests inside this `describe` for the current file */
  skip: Describe;
  each: Each;
}

interface Each {
  // Exclusively arrays.
  <T extends any[]> (cases: ReadonlyArray<T>): (
    name: string,
    fn: (...args: T) => any,
    timeout?: number
  ) => void;
  // Not arrays.
  <T> (cases: ReadonlyArray<T>): (
    name: string,
    fn: (...args: T[]) => any,
    timeout?: number
  ) => void;
  (cases: ReadonlyArray<ReadonlyArray<any>>): (
    name: string,
    fn: (...args: any[]) => any,
    timeout?: number
  ) => void;
  (strings: TemplateStringsArray, ...placeholders: any[]): (
    name: string,
    fn: (arg: any) => any,
    timeout?: number
  ) => void;
}

/**
     * The `expect` function is used every time you want to test a value.
     * You will rarely call `expect` by itself.
     */
interface Expect {
  /**
   * The `expect` function is used every time you want to test a value.
   * You will rarely call `expect` by itself.
   *
   * @param actual The value to apply matchers against.
   */
  <T = any> (actual: T): Matchers<T>;
  /**
   * Matches anything but null or undefined. You can use it inside `toEqual` or `toBeCalledWith` instead
   * of a literal value. For example, if you want to check that a mock function is called with a
   * non-null argument:
   *
   * @example
   *
   * test('map calls its argument with a non-null argument', () => {
   *   const mock = jest.fn();
   *   [1].map(x => mock(x));
   *   expect(mock).toBeCalledWith(expect.anything());
   * });
   *
   */
  anything (): any;
  /**
   * Matches anything that was created with the given constructor.
   * You can use it inside `toEqual` or `toBeCalledWith` instead of a literal value.
   *
   * @example
   *
   * function randocall(fn) {
   *   return fn(Math.floor(Math.random() * 6 + 1));
   * }
   *
   * test('randocall calls its callback with a number', () => {
   *   const mock = jest.fn();
   *   randocall(mock);
   *   expect(mock).toBeCalledWith(expect.any(Number));
   * });
   */
  any (classType: any): any;
  /**
   * Matches any array made up entirely of elements in the provided array.
   * You can use it inside `toEqual` or `toBeCalledWith` instead of a literal value.
   */
  arrayContaining (arr: any[]): any;
  /**
   * Verifies that a certain number of assertions are called during a test.
   * This is often useful when testing asynchronous code, in order to
   * make sure that assertions in a callback actually got called.
   */
  assertions (num: number): void;
  /**
   * Verifies that at least one assertion is called during a test.
   * This is often useful when testing asynchronous code, in order to
   * make sure that assertions in a callback actually got called.
   */
  hasAssertions (): void;
  /**
   * You can use `expect.extend` to add your own matchers to Jest.
   */
  extend (obj: ExpectExtendMap): void;
  /**
   * Adds a module to format application-specific data structures for serialization.
   */
  addSnapshotSerializer (serializer: SnapshotSerializerPlugin): void;
  /**
   * Matches any object that recursively matches the provided keys.
   * This is often handy in conjunction with other asymmetric matchers.
   */
  objectContaining (obj: {}): any;
  /**
   * Matches any string that contains the exact provided string
   */
  stringMatching (str: string | RegExp): any;
  /**
   * Matches any received string that contains the exact expected string
   */
  stringContaining (str: string): any;

  not: InverseAsymmetricMatchers;
}

interface Matchers<R> {
  /**
   * Ensures the last call to a mock function was provided specific args.
   */
  lastCalledWith (...args: any[]): R;
  /**
   * Ensure that the last call to a mock function has returned a specified value.
   */
  lastReturnedWith (value: any): R;
  /**
   * If you know how to test something, `.not` lets you test its opposite.
   */
  not: Matchers<R>;
  /**
   * Ensure that a mock function is called with specific arguments on an Nth call.
   */
  nthCalledWith (nthCall: number, ...params: any[]): R;
  /**
   * Ensure that the nth call to a mock function has returned a specified value.
   */
  nthReturnedWith (n: number, value: any): R;
  /**
   * Use resolves to unwrap the value of a fulfilled promise so any other
   * matcher can be chained. If the promise is rejected the assertion fails.
   */
  resolves: Matchers<Promise<R>>;
  /**
   * Unwraps the reason of a rejected promise so any other matcher can be chained.
   * If the promise is fulfilled the assertion fails.
   */
  rejects: Matchers<Promise<R>>;
  /**
   * Checks that a value is what you expect. It uses `===` to check strict equality.
   * Don't use `toBe` with floating-point numbers.
   */
  toBe (expected: any): R;
  /**
   * Ensures that a mock function is called.
   */
  toBeCalled (): R;
  /**
   * Ensures that a mock function is called an exact number of times.
   */
  toBeCalledTimes (expected: number): R;
  /**
   * Ensure that a mock function is called with specific arguments.
   */
  toBeCalledWith (...args: any[]): R;
  /**
   * Using exact equality with floating point numbers is a bad idea.
   * Rounding means that intuitive things fail.
   * The default for numDigits is 2.
   */
  toBeCloseTo (expected: number, numDigits?: number): R;
  /**
   * Ensure that a variable is not undefined.
   */
  toBeDefined (): R;
  /**
   * When you don't care what a value is, you just want to
   * ensure a value is false in a boolean context.
   */
  toBeFalsy (): R;
  /**
   * For comparing floating point numbers.
   */
  toBeGreaterThan (expected: number): R;
  /**
   * For comparing floating point numbers.
   */
  toBeGreaterThanOrEqual (expected: number): R;
  /**
   * Ensure that an object is an instance of a class.
   * This matcher uses `instanceof` underneath.
   */
  toBeInstanceOf (expected: any): R;
  /**
   * For comparing floating point numbers.
   */
  toBeLessThan (expected: number): R;
  /**
   * For comparing floating point numbers.
   */
  toBeLessThanOrEqual (expected: number): R;
  /**
   * This is the same as `.toBe(null)` but the error messages are a bit nicer.
   * So use `.toBeNull()` when you want to check that something is null.
   */
  toBeNull (): R;
  /**
   * Use when you don't care what a value is, you just want to ensure a value
   * is true in a boolean context. In JavaScript, there are six falsy values:
   * `false`, `0`, `''`, `null`, `undefined`, and `NaN`. Everything else is truthy.
   */
  toBeTruthy (): R;
  /**
   * Used to check that a variable is undefined.
   */
  toBeUndefined (): R;
  /**
   * Used to check that a variable is NaN.
   */
  toBeNaN (): R;
  /**
   * Used when you want to check that an item is in a list.
   * For testing the items in the list, this uses `===`, a strict equality check.
   */
  toContain (expected: any): R;
  /**
   * Used when you want to check that an item is in a list.
   * For testing the items in the list, this  matcher recursively checks the
   * equality of all fields, rather than checking for object identity.
   */
  toContainEqual (expected: any): R;
  /**
   * Used when you want to check that two objects have the same value.
   * This matcher recursively checks the equality of all fields, rather than checking for object identity.
   */
  toEqual (expected: any): R;
  /**
   * Ensures that a mock function is called.
   */
  toHaveBeenCalled (): R;
  /**
   * Ensures that a mock function is called an exact number of times.
   */
  toHaveBeenCalledTimes (expected: number): R;
  /**
   * Ensure that a mock function is called with specific arguments.
   */
  toHaveBeenCalledWith (...params: any[]): R;
  /**
   * Ensure that a mock function is called with specific arguments on an Nth call.
   */
  toHaveBeenNthCalledWith (nthCall: number, ...params: any[]): R;
  /**
   * If you have a mock function, you can use `.toHaveBeenLastCalledWith`
   * to test what arguments it was last called with.
   */
  toHaveBeenLastCalledWith (...params: any[]): R;
  /**
   * Use to test the specific value that a mock function last returned.
   * If the last call to the mock function threw an error, then this matcher will fail
   * no matter what value you provided as the expected return value.
   */
  toHaveLastReturnedWith (expected: any): R;
  /**
   * Used to check that an object has a `.length` property
   * and it is set to a certain numeric value.
   */
  toHaveLength (expected: number): R;
  /**
   * Use to test the specific value that a mock function returned for the nth call.
   * If the nth call to the mock function threw an error, then this matcher will fail
   * no matter what value you provided as the expected return value.
   */
  toHaveNthReturnedWith (nthCall: number, expected: any): R;
  /**
   * Use to check if property at provided reference keyPath exists for an object.
   * For checking deeply nested properties in an object you may use dot notation or an array containing
   * the keyPath for deep references.
   *
   * Optionally, you can provide a value to check if it's equal to the value present at keyPath
   * on the target object. This matcher uses 'deep equality' (like `toEqual()`) and recursively checks
   * the equality of all fields.
   *
   * @example
   *
   * expect(houseForSale).toHaveProperty('kitchen.area', 20);
   */
  toHaveProperty (propertyPath: string | any[], value?: any): R;
  /**
   * Use to test that the mock function successfully returned (i.e., did not throw an error) at least one time
   */
  toHaveReturned (): R;
  /**
   * Use to ensure that a mock function returned successfully (i.e., did not throw an error) an exact number of times.
   * Any calls to the mock function that throw an error are not counted toward the number of times the function returned.
   */
  toHaveReturnedTimes (expected: number): R;
  /**
   * Use to ensure that a mock function returned a specific value.
   */
  toHaveReturnedWith (expected: any): R;
  /**
   * Check that a string matches a regular expression.
   */
  toMatch (expected: string | RegExp): R;
  /**
   * Used to check that a JavaScript object matches a subset of the properties of an object
   *
   * Optionally, you can provide an object to use as Generic type for the expected value.
   * This ensures that the matching object matches the structure of the provided object-like type.
   *
   * @example
   *
   * type House = {
   *   bath: boolean;
   *   bedrooms: number;
   *   kitchen: {
   *     amenities: string[];
   *     area: number;
   *     wallColor: string;
   *   }
   * };
   *
   * expect(desiredHouse).toMatchObject<House>(...standardHouse, kitchen: {area: 20}) // wherein standardHouse is some base object of type House
   */
  toMatchObject<E extends {} | any[]> (expected: E): R;
  /**
   * This ensures that a value matches the most recent snapshot with property matchers.
   * Check out [the Snapshot Testing guide](http://facebook.github.io/jest/docs/snapshot-testing.html) for more information.
   */
  toMatchSnapshot<T extends { [P in keyof R]: any }> (propertyMatchers: Partial<T>, snapshotName?: string): R;
  /**
   * This ensures that a value matches the most recent snapshot.
   * Check out [the Snapshot Testing guide](http://facebook.github.io/jest/docs/snapshot-testing.html) for more information.
   */
  toMatchSnapshot (snapshotName?: string): R;
  /**
   * This ensures that a value matches the most recent snapshot with property matchers.
   * Instead of writing the snapshot value to a .snap file, it will be written into the source code automatically.
   * Check out [the Snapshot Testing guide](http://facebook.github.io/jest/docs/snapshot-testing.html) for more information.
   */
  toMatchInlineSnapshot<T extends { [P in keyof R]: any }> (propertyMatchers: Partial<T>, snapshot?: string): R;
  /**
   * This ensures that a value matches the most recent snapshot with property matchers.
   * Instead of writing the snapshot value to a .snap file, it will be written into the source code automatically.
   * Check out [the Snapshot Testing guide](http://facebook.github.io/jest/docs/snapshot-testing.html) for more information.
   */
  toMatchInlineSnapshot (snapshot?: string): R;
  /**
   * Ensure that a mock function has returned (as opposed to thrown) at least once.
   */
  toReturn (): R;
  /**
   * Ensure that a mock function has returned (as opposed to thrown) a specified number of times.
   */
  toReturnTimes (count: number): R;
  /**
   * Ensure that a mock function has returned a specified value at least once.
   */
  toReturnWith (value: any): R;
  /**
   * Use to test that objects have the same types as well as structure.
   */
  toStrictEqual (expected: {}): R;
  /**
   * Used to test that a function throws when it is called.
   */
  toThrow (error?: string | Constructable | RegExp | Error): R;
  /**
   * If you want to test that a specific error is thrown inside a function.
   */
  toThrowError (error?: string | Constructable | RegExp | Error): R;
  /**
   * Used to test that a function throws a error matching the most recent snapshot when it is called.
   */
  toThrowErrorMatchingSnapshot (): R;
  /**
   * Used to test that a function throws a error matching the most recent snapshot when it is called.
   * Instead of writing the snapshot value to a .snap file, it will be written into the source code automatically.
   */
  toThrowErrorMatchingInlineSnapshot (snapshot?: string): R;
}