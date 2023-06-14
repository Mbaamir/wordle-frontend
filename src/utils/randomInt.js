export function getRandomInteger() {
  var min = 1000;
  var max = 100000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
