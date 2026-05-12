export default (api, implementation) => ({
  // Note: in real code, you should use `math.pow()` from the built-in
  // `sass:math` module.

  "pow($base, $exponent)"(args) {
    const base = args[0].assertNumber("base").assertNoUnits("base");
    const exponent = args[1].assertNumber("exponent").assertNoUnits("exponent");

    return new implementation.SassNumber(base.value ** exponent.value);
  },
});
