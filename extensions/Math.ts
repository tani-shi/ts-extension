export {};

declare global {
  interface Math {
    clamp(value: number, min: number, max: number): number;
    randomRange(min: number, max: number): number;
  }
}

Math.clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

Math.randomRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);
