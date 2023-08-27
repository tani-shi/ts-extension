export {};

declare global {
  interface Array<T> {
    clear(): void;
    first(): T | undefined;
    last(): T | undefined;
    remove(item: T): boolean;
    distinct(predicate?: (item: T) => unknown): T[];
    sum(predicate: (item: T, index: number, self: Array<T>) => number): number;
    max(predicate: (item: T) => number): T;
    min(predicate: (item: T) => number): T;
    orderBy(
      predicate: (item: T) => number | string | Date,
      ascending?: boolean,
    ): T[];
    insert(index: number, item: T): T[];
    toRecord(
      key: (item: T) => string | number | symbol,
    ): Record<string | number | symbol, T>;
    selectMany<I>(predicate: (item: T) => I[]): I[];
    any(): boolean;
    groupBy<K extends string | number>(
      func: (e: T, i: number) => K,
    ): Partial<Record<K, T[]>>;
  }
}

Array.prototype.clear = function <T>(this: Array<T>): void {
  while (this.length) this.pop();
};

Array.prototype.first = function <T>(this: Array<T>): T | undefined {
  return this.length > 0 ? this[0] : undefined;
};

Array.prototype.last = function <T>(this: Array<T>): T | undefined {
  return this.length > 0 ? this[this.length - 1] : undefined;
};

Array.prototype.remove = function <T>(this: Array<T>, item: T): boolean {
  const index = this.findIndex((i) => i === item);
  if (index >= 0) {
    this.splice(index, 1);
    return true;
  }
  return false;
};

Array.prototype.distinct = function <T>(
  this: Array<T>,
  predicate?: (item: T) => unknown,
): T[] {
  if (predicate) {
    return this.filter(
      (value, index, self) =>
        self.findIndex((v) => predicate(v) === predicate(value)) === index,
    );
  }
  return this.filter((value, index, self) => self.indexOf(value) === index);
};

Array.prototype.sum = function <T>(
  this: Array<T>,
  predicate: (item: T, index: number, self: Array<T>) => number,
): number {
  return this.reduce(
    (prev, curr, i, self) => prev + predicate(curr, i, self),
    0,
  );
};

Array.prototype.max = function <T>(
  this: Array<T>,
  predicate: (item: T) => number,
): T {
  return this.reduce((prev, curr) =>
    predicate(prev) < predicate(curr) ? curr : prev,
  );
};

Array.prototype.min = function <T>(
  this: Array<T>,
  predicate: (item: T) => number,
): T {
  return this.reduce((prev, curr) =>
    predicate(prev) > predicate(curr) ? curr : prev,
  );
};

Array.prototype.orderBy = function <T>(
  this: Array<T>,
  predicate: (item: T) => number | string | Date,
  ascending = true,
): T[] {
  return this.slice(0).sort((a, b) => {
    const va = predicate(a);
    const vb = predicate(b);
    if (typeof va === 'number' && typeof vb === 'number') {
      return ascending ? va - vb : vb - va;
    }
    if (typeof va === 'string' && typeof vb === 'string') {
      return ascending ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    if (va instanceof Date && vb instanceof Date) {
      return ascending
        ? va.getTime() - vb.getTime()
        : vb.getTime() - va.getTime();
    }
    return 0;
  });
};

Array.prototype.insert = function <T>(
  this: Array<T>,
  index: number,
  item: T,
): T[] {
  const result = [...this];
  result.splice(index, 0, item);
  return result;
};

Array.prototype.toRecord = function <T>(
  this: Array<T>,
  key: (item: T) => string | number | symbol,
): Record<string | number | symbol, T> {
  return Object.assign({}, ...this.map((x) => ({ [key(x)]: x })));
};

Array.prototype.selectMany = function <T, I>(
  this: Array<T>,
  predicate: (item: T) => I[],
): I[] {
  return this.reduce<I[]>((prev, curr) => prev.concat(predicate(curr)), []);
};

Array.prototype.any = function <T>(this: Array<T>): boolean {
  return this.length > 0;
};

Array.prototype.groupBy = function <T, K extends string | number>(
  this: Array<T>,
  func: (e: T, i: number) => K,
): Partial<Record<K, T[]>> {
  return this.reduce((prev, curr, i) => {
    const key = func(curr, i);
    // eslint-disable-next-line no-param-reassign
    (prev[key] || (prev[key] = []))!.push(curr);
    return prev;
  }, {} as Partial<Record<K, T[]>>);
};
