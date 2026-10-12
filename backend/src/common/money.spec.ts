import { parseMoney } from "./money";
describe("Valores em centavos", () => {
  it.each([
    ["10,50", 1050],
    ["10.50", 1050],
    ["1", 100],
    ["0,01", 1],
    ["21474836,47", 2147483647],
  ])("converte %s sem perda de precisão", (input, expected) =>
    expect(parseMoney(input)).toBe(expected),
  );
  it.each(["0", "-1", "1,001", "21474836,48", "1.000,00", "", "NaN", "1e3"])(
    "rejeita %s sem arredondar ou aceitar formato ambíguo",
    (input) => expect(() => parseMoney(input)).toThrow(),
  );
});
