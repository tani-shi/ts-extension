export const CellFunctionNames = [
  'SUM',
  'SUBTRACT',
  'MULTIPLY',
  'DIVIDE',
  'AVG',
  'MAX',
  'MIN',
  'IF',
  'LESS_THAN',
  'GREATER_THAN',
  'LESS_THAN_OR_EQUAL',
  'GREATER_THAN_OR_EQUAL',
  'EQUALS',
  'NOT_EQUAL',
  'LITERAL',
] as const;

export type CellFunctionName = (typeof CellFunctionNames)[number];

export type CellFunctionValue = string | number | boolean | Date | null;

export type CellFunction = {
  name: CellFunctionName;
  args: (CellFunctionValue | CellFunction)[];
};

const commaLiteral = '__COMMA__';

export const valueToString = (
  value: CellFunctionValue | CellFunction,
): string => {
  if (value !== null) {
    switch (typeof value) {
      case 'string':
        return value;
      case 'boolean':
        return value ? 'true' : 'false';
      case 'number':
        return value.toString();
      default:
        return 'name' in value ? JSON.stringify(value) : value.toLocaleString();
    }
  }
  return '';
};

export const stringToValue = (
  str: string | undefined,
  type: 'string' | 'number' | 'boolean' | 'Date' | 'fx',
): string | number | boolean | Date | CellFunction | null => {
  if (!str) {
    return null;
  }
  switch (type) {
    case 'string':
      return str;
    case 'number':
      return Number.isNaN(Number(str)) ? null : Number(str);
    case 'boolean':
      switch (str.toLowerCase()) {
        case 'true':
        case 'yes':
        case 'on':
        case '1':
          return true;
        case 'false':
        case 'no':
        case '0':
          return false;
        default:
          return null;
      }
    case 'Date':
      return !Number.isNaN(Date.parse(str)) ? new Date(str) : null;
    case 'fx':
      return JSON.parse(str) as CellFunction;
    default:
      return null;
  }
};

export const indexToColumn = (index: number) => {
  let column = '';
  let i = index;
  while (i >= 0) {
    const [quotient, remainder] = [Math.floor(i / 26), i % 26];
    column = String.fromCharCode(65 + remainder) + column;
    i = quotient - 1;
  }
  return column;
};

export const columnToIndex = (col: string) =>
  col.charCodeAt(0) - 'A'.charCodeAt(0);

export function incrementCellReferencesInString(
  str: string,
  rowIncrement: number,
  colIncrement: number,
): string {
  const regex = /[A-Z]+\d+/g;
  let match;
  let result = str.replace(/[A-Z]+\d+/g, (x) => `__${x}__`);
  const matches: { [key: string]: string } = {};
  while ((match = regex.exec(str)) !== null) {
    const originalValue = match[0];
    if (!matches[originalValue]) {
      const col = originalValue.match(/[A-Z]+/)?.[0] ?? ``;
      const colIndex = columnToIndex(col);
      const newCol = indexToColumn(colIndex + colIncrement);
      const row = parseInt(originalValue.match(/\d+/)?.[0] ?? ``, 10);
      const newRow = row + rowIncrement;
      const newValue = newCol + newRow;
      matches[originalValue] = newValue;
    }
  }
  Object.entries(matches).forEach(([originalValue, newValue]) => {
    result = result.split(`__${originalValue}__`).join(newValue);
  });
  return result;
}

export namespace CellFunctionParser {
  const isNumeric = (input: string): boolean =>
    !Number.isNaN(parseFloat(input)) && Number.isFinite(parseFloat(input));

  const parseCalculationExpression = (
    expression: string,
  ): CellFunction | string | number => {
    let i = 0;

    function parseAtom(): CellFunction | number | string {
      const start = i;
      if (expression[i] === '(') {
        i++;
        const result = parseExpression();
        i++;
        return result;
      }
      if (expression[i] === '-') {
        i++;
        return -parseAtom();
      }
      while (i < expression.length && /\d|\w/.test(expression[i])) i++;
      const atom = expression.slice(start, i);
      return Number.isNaN(+atom) ? atom : +atom;
    }

    function parseMultiplication(): CellFunction | number | string {
      let left = parseAtom();
      while (expression[i] === '*' || expression[i] === '/') {
        const op = expression[i++];
        const right = parseAtom();
        left = {
          name: op === '*' ? 'MULTIPLY' : 'DIVIDE',
          args: [left, right],
        };
      }
      return left;
    }

    function parseExpression(): CellFunction | number | string {
      let left = parseMultiplication();
      while (
        (i < expression.length && expression[i] === '+') ||
        expression[i] === '-'
      ) {
        const op = expression[i++];
        const right = parseMultiplication();
        left = {
          name: op === '+' ? 'SUM' : 'SUBTRACT',
          args: [left, right],
        };
      }
      return left;
    }

    return parseExpression();
  };

  const createLiteral = (value: CellFunctionValue): CellFunction => ({
    name: 'LITERAL',
    args: [value],
  });

  const parseExpression = (
    expression: string,
    cells: { value: CellFunctionValue | CellFunction }[][],
  ): CellFunction => {
    // Check for cell reference
    if (expression.match(/^[A-Z]+[0-9]+$/)) {
      return createLiteral(expression);
    }

    // Check for calculation expression
    if (expression.match(/(\+|-|\*|\/)/)) {
      const parsed = parseCalculationExpression(expression);
      if (typeof parsed === 'object' && parsed !== null && 'name' in parsed) {
        return parsed;
      }
      return createLiteral(parsed);
    }

    // Check for operator
    if (expression.includes('<')) {
      const [left = NaN, right = NaN] = expression
        .split('<')
        .map((part) => parseExpression(part.trim(), cells));
      return { name: 'LESS_THAN', args: [left, right] };
    }
    if (expression.includes('>')) {
      const [left = NaN, right = NaN] = expression
        .split('>')
        .map((part) => parseExpression(part.trim(), cells));
      return { name: 'GREATER_THAN', args: [left, right] };
    }
    if (expression.includes('<=')) {
      const [left = NaN, right = NaN] = expression
        .split('<=')
        .map((part) => parseExpression(part.trim(), cells));
      return { name: 'LESS_THAN_OR_EQUAL', args: [left, right] };
    }
    if (expression.includes('>=')) {
      const [left = NaN, right = NaN] = expression
        .split('>=')
        .map((part) => parseExpression(part.trim(), cells));
      return { name: 'GREATER_THAN_OR_EQUAL', args: [left, right] };
    }
    if (expression.includes('=')) {
      const [left, right] = expression
        .split('=')
        .map((part) => parseExpression(part.trim(), cells));
      return { name: 'EQUALS', args: [left, right] };
    }
    if (expression.includes('<>')) {
      const [left, right] = expression
        .split('<>')
        .map((part) => parseExpression(part.trim(), cells));
      return { name: 'NOT_EQUAL', args: [left, right] };
    }

    // Check for value
    if (isNumeric(expression)) {
      return createLiteral(Number(expression));
    }
    if (expression === 'TRUE' || expression === 'FALSE') {
      return createLiteral(expression === 'TRUE');
    }
    if (expression.startsWith('"') && expression.endsWith('"')) {
      return createLiteral(expression.substring(1, expression.length - 1));
    }
    if (expression.startsWith("'") && expression.endsWith("'")) {
      return createLiteral(expression.substring(1, expression.length - 1));
    }

    throw new Error(`Invalid expression: ${expression}`);
  };

  const evaluateLiteral = (
    literal: string,
    cells: { value: CellFunctionValue | CellFunction }[][],
    depth: number,
  ): CellFunctionValue => {
    // Check for cell reference
    if (literal.match(/^[A-Z]+[0-9]+$/)) {
      const [colString, rowString] = literal.split(/(\d+)/);
      const row = parseInt(rowString, 10) - 1;
      const col = colString.charCodeAt(0) - 65;
      const cellValue = cells[row][col].value;
      if (
        typeof cellValue === 'object' &&
        cellValue !== null &&
        'name' in cellValue
      ) {
        return evaluate(cellValue, cells, depth);
      }
      return cellValue;
    }

    // Check for value
    if (isNumeric(literal)) {
      return Number(literal);
    }
    if (literal === 'TRUE' || literal === 'FALSE') {
      return literal === 'TRUE';
    }
    if (literal.startsWith('"') && literal.endsWith('"')) {
      return literal.substring(1, literal.length - 1);
    }
    if (literal.startsWith("'") && literal.endsWith("'")) {
      return literal.substring(1, literal.length - 1);
    }

    return literal;
  };

  const compareValues = (
    cellFunction: CellFunction,
    cells: { value: CellFunctionValue | CellFunction }[][],
    predicate: (a: number, b: number) => boolean,
    depth: number,
  ): boolean => {
    if (cellFunction.args.length !== 2) {
      throw new Error(
        `LESS_THAN function requires 2 arguments, received ${cellFunction.args.length}`,
      );
    }

    const left = cellFunction.args[0];
    const right = cellFunction.args[1];

    let leftValue;
    if (typeof left === 'object' && left !== null && 'name' in left) {
      leftValue = evaluate(left, cells, depth);
    } else if (typeof left === 'number') {
      leftValue = left;
    } else if (typeof left === 'string') {
      leftValue = evaluateLiteral(left, cells, depth);
    }

    let rightValue;
    if (typeof right === 'object' && right !== null && 'name' in right) {
      rightValue = evaluate(right, cells, depth);
    } else if (typeof right === 'number') {
      rightValue = right;
    } else if (typeof right === 'string') {
      rightValue = evaluateLiteral(right, cells, depth);
    }

    if (typeof leftValue !== 'number' || typeof rightValue !== 'number') {
      throw new Error('');
    }

    return predicate(leftValue, rightValue);
  };

  export const parse = (
    input: string,
    cells: { value: CellFunctionValue | CellFunction }[][],
  ): CellFunction => {
    input = input.replaceAll(' ', '');

    if (!CellFunctionNames.some((x) => input.includes(`${x}(`))) {
      const cellFunction = parseExpression(input, cells);
      if (
        typeof cellFunction === 'object' &&
        cellFunction !== null &&
        'name' in cellFunction
      ) {
        return cellFunction;
      }
      return { name: 'LITERAL', args: [cellFunction] };
    }

    let level = 0;
    let start = 0;
    let end = 0;
    for (let i = 0; i < input.length; i += 1) {
      if (input[i] === '(') {
        if (level === 0) {
          start = i;
        }
        level += 1;
      } else if (input[i] === ')') {
        level -= 1;
        if (level === 0) {
          end = i;
          break;
        }
      } else if (input[i] === ',' && level > 1) {
        input = input
          .split('')
          .map((w, idx) => (idx === i ? commaLiteral : w))
          .join('');
      }
    }
    if (level === 0 && start === 0 && end === 0) {
      if (isNumeric(input)) {
        return { name: 'LITERAL', args: [parseFloat(input)] };
      }
      const cellFunction = parseExpression(input, cells);
      if (
        typeof cellFunction === 'object' &&
        cellFunction !== null &&
        'name' in cellFunction
      ) {
        return cellFunction;
      }
      return { name: 'LITERAL', args: [cellFunction] };
    }
    const name = input.slice(0, start).trim();
    if (!CellFunctionNames.some((x) => x === name)) {
      throw new Error(`Invalid function name: ${name}`);
    }
    const args = input
      .slice(start + 1, end)
      .split(',')
      .map((x) => {
        const arg = x.trim();
        if (arg.includes('(')) {
          return parse(arg.replaceAll(commaLiteral, ','), cells);
        }
        if (isNumeric(arg)) {
          return parseFloat(arg);
        }
        return arg;
      });
    return { name: name as CellFunctionName, args };
  };

  export const evaluate = (
    cellFunction: CellFunction,
    cells: { value: CellFunctionValue | CellFunction }[][],
    depth = 0,
  ): CellFunctionValue => {
    if (depth > 10) {
      return NaN;
    }

    try {
      switch (cellFunction.name) {
        case 'SUM': {
          return cellFunction.args.reduce<number>((acc, arg) => {
            if (typeof arg === 'object' && arg !== null && 'name' in arg) {
              const evaluated = evaluate(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                return acc + evaluated;
              }
            }
            if (typeof arg === 'number') {
              return acc + arg;
            }
            if (typeof arg === 'string') {
              const evaluated = evaluateLiteral(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                return acc + evaluated;
              }
            }
            return NaN;
          }, 0);
        }
        case 'SUBTRACT': {
          return cellFunction.args.reduce<number>((acc, arg, i) => {
            if (typeof arg === 'object' && arg !== null && 'name' in arg) {
              const evaluated = evaluate(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                return i === 0 ? evaluated - acc : acc - evaluated;
              }
            }
            if (typeof arg === 'number') {
              return i === 0 ? arg - acc : acc - arg;
            }
            if (typeof arg === 'string') {
              const evaluated = evaluateLiteral(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                return i === 0 ? evaluated - acc : acc - evaluated;
              }
            }
            return NaN;
          }, 0);
        }
        case 'MULTIPLY': {
          return cellFunction.args.reduce<number>((acc, arg) => {
            if (typeof arg === 'object' && arg !== null && 'name' in arg) {
              const evaluated = evaluate(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                return acc * evaluated;
              }
            }
            if (typeof arg === 'number') {
              return acc * arg;
            }
            if (typeof arg === 'string') {
              const evaluated = evaluateLiteral(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                return acc * evaluated;
              }
            }
            return NaN;
          }, 1);
        }
        case 'DIVIDE': {
          return cellFunction.args.reduce<number>((acc, arg, i) => {
            if (typeof arg === 'object' && arg !== null && 'name' in arg) {
              const evaluated = evaluate(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                return i === 0 ? evaluated : acc / evaluated;
              }
            }
            if (typeof arg === 'number') {
              return i === 0 ? arg : acc / arg;
            }
            if (typeof arg === 'string') {
              const evaluated = evaluateLiteral(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                return i === 0 ? evaluated : acc / evaluated;
              }
            }
            return NaN;
          }, 0);
        }
        case 'AVG': {
          let count = 0;
          const sum = cellFunction.args.reduce<number>((acc, arg) => {
            if (typeof arg === 'object' && arg !== null && 'name' in arg) {
              const evaluated = evaluate(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                count += 1;
                return acc + evaluated;
              }
            }
            if (typeof arg === 'number') {
              count += 1;
              return acc + arg;
            }
            if (typeof arg === 'string') {
              const evaluated = evaluateLiteral(arg, cells, depth + 1);
              if (typeof evaluated === 'number') {
                count += 1;
                return acc + evaluated;
              }
            }
            return NaN;
          }, 0);
          return count > 0 ? sum / count : NaN;
        }
        case 'MAX': {
          return Math.max(
            ...cellFunction.args.map((arg) => {
              if (typeof arg === 'object' && arg !== null && 'name' in arg) {
                const evaluated = evaluate(arg, cells, depth + 1);
                if (typeof evaluated === 'number') {
                  return evaluated;
                }
              }
              if (typeof arg === 'number') {
                return arg;
              }
              if (typeof arg === 'string') {
                const evaluated = evaluateLiteral(arg, cells, depth + 1);
                if (typeof evaluated === 'number') {
                  return evaluated;
                }
              }
              return NaN;
            }),
          );
        }
        case 'MIN': {
          return Math.min(
            ...cellFunction.args.map((arg) => {
              if (typeof arg === 'object' && arg !== null && 'name' in arg) {
                const evaluated = evaluate(arg, cells, depth + 1);
                if (typeof evaluated === 'number') {
                  return evaluated;
                }
              }
              if (typeof arg === 'number') {
                return arg;
              }
              if (typeof arg === 'string') {
                const evaluated = evaluateLiteral(arg, cells, depth + 1);
                if (typeof evaluated === 'number') {
                  return evaluated;
                }
              }
              return NaN;
            }),
          );
        }
        case 'IF': {
          if (cellFunction.args.length !== 3) {
            throw new Error(
              `IF function requires 3 arguments, received ${cellFunction.args.length}`,
            );
          }
          const condition = cellFunction.args[0];
          const thenValue = cellFunction.args[1];
          const elseValue = cellFunction.args[2];
          let result;

          if (
            typeof condition === 'object' &&
            condition !== null &&
            'name' in condition
          ) {
            const evaluated = evaluate(condition, cells, depth + 1);
            if (typeof evaluated === 'boolean') {
              result = evaluated ? thenValue : elseValue;
            }
          }
          if (typeof condition === 'boolean') {
            result = condition ? thenValue : elseValue;
          }
          if (typeof condition === 'string') {
            const evaluated = evaluateLiteral(condition, cells, depth + 1);
            if (typeof evaluated === 'boolean') {
              result = evaluated ? thenValue : elseValue;
            }
          }
          if (result !== undefined) {
            if (
              typeof result === 'object' &&
              result !== null &&
              'name' in result
            ) {
              return evaluate(result, cells, depth + 1);
            }
            return result;
          }
          return NaN;
        }
        case 'LESS_THAN': {
          return compareValues(cellFunction, cells, (a, b) => a < b, depth + 1);
        }
        case 'GREATER_THAN': {
          return compareValues(cellFunction, cells, (a, b) => a > b, depth + 1);
        }
        case 'LESS_THAN_OR_EQUAL': {
          return compareValues(
            cellFunction,
            cells,
            (a, b) => a <= b,
            depth + 1,
          );
        }
        case 'GREATER_THAN_OR_EQUAL': {
          return compareValues(
            cellFunction,
            cells,
            (a, b) => a >= b,
            depth + 1,
          );
        }
        case 'EQUALS': {
          return compareValues(
            cellFunction,
            cells,
            (a, b) => a === b,
            depth + 1,
          );
        }
        case 'NOT_EQUAL': {
          return compareValues(
            cellFunction,
            cells,
            (a, b) => a === b,
            depth + 1,
          );
        }
        case 'LITERAL': {
          const [arg] = cellFunction.args;
          if (
            arg === undefined ||
            (typeof arg === 'object' && arg !== null && 'name' in arg)
          ) {
            return NaN;
          }
          if (typeof arg === 'string') {
            return evaluateLiteral(arg, cells, depth + 1);
          }
          return arg;
        }
        default: {
          throw new Error(`Invalid function name: ${cellFunction.name}`);
        }
      }
    } catch (e) {
      return NaN;
    }
  };
}
