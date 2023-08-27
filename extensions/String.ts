export {};

declare global {
  interface String {
    searchAll(regexp: RegExp): string[];
    toKey(): string;
  }
}

String.prototype.searchAll = function (this: string, regexp: RegExp): string[] {
  const results: string[] = [];
  const matches = this.matchAll(regexp);
  if (matches) {
    Array.from(matches).forEach((match) => {
      if (match && match.length > 1) {
        results.push(match[1]);
      }
    });
  }
  return results;
};

String.prototype.toKey = function (this: string): string {
  return this.toLowerCase().replace(/([^0-9a-z]+)/g, '-');
};
