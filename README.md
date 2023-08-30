# ts-extension

`ts-extension` is a collection of useful prototype methods for core JavaScript types like `Array`, `Date`, `Math`, `Number`, and `String`. It simplifies many routine operations, making them more readable and less error-prone.

## Installation

```bash
npm install @tani-shi/ts-extension
```

## Usage

Once installed, you can import the package to enable the extensions:

```javascript
import '@tani-shi/ts-extension';
```

Here's a quick overview of the provided methods:

### Array

- **clear**: Empties the array.
- **first**: Returns the first item or `undefined`.
- **last**: Returns the last item or `undefined`.
- **remove**: Removes an item from the array.
- **distinct**: Filters out duplicate values.
- **sum**: Calculates the sum of array items.
- **max**: Finds the maximum value.
- **min**: Finds the minimum value.
- **orderBy**: Orders items by a certain criteria.
- **insert**: Inserts an item at a given position.
- **toRecord**: Transforms an array into a record.
- **selectMany**: Flattens arrays.
- **any**: Checks if array contains any items.
- **groupBy**: Groups items by a certain criteria.

### Date

- **addDays**: Adds days to the date.
- **addHours**: Adds hours to the date.
- **addMinutes**: Adds minutes to the date.
- **addSeconds**: Adds seconds to the date.

### Math

- **clamp**: Clamps a value within a range.
- **randomRange**: Generates a random number within a range.

### Number

- **formatBytes**: Converts a number to a human-readable byte size.

### String

- **searchAll**: Searches for all matches of a regex pattern.
- **toKey**: Converts a string into a key format.

## Examples

### Array
```javascript
const arr = [1, 2, 3, 4, 5];
arr.clear();  // Clears the array
console.log(arr.first());  // Outputs: 1
console.log(arr.last());   // Outputs: 5
arr.remove(3); // Removes the number 3 from the array
```

### Date
```javascript
const date = new Date();
console.log(date.addDays(2));  // Outputs date 2 days from now
```

### Math
```javascript
console.log(Math.clamp(5, 1, 10));      // Outputs: 5
console.log(Math.randomRange(1, 10));  // Outputs a random number between 1 and 10
```

### Number
```javascript
const num = 1048576;
console.log(num.formatBytes());  // Outputs: 1.00MB
```

### String
```javascript
const str = "Hello world";
console.log(str.toKey());  // Outputs: hello-world
```

## Note

Be aware that extending built-in prototypes is often discouraged because it can interfere with other libraries and cause unexpected side effects. Use this package responsibly and test thoroughly when integrating with other libraries.

## Contributing

Feel free to open an issue or submit a pull request if you find a bug or think a new method would be beneficial. All contributions are welcome!

## License

MIT