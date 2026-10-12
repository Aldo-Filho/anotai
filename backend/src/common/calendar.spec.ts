import { todayInSaoPaulo, validateDateOnly } from "./calendar";
describe("Datas de calendário", () => {
  it("usa o dia de São Paulo perto de meia-noite UTC", () =>
    expect(todayInSaoPaulo(new Date("2026-10-13T01:00:00Z"))).toBe(
      "2026-10-12",
    ));
  it("preserva uma data válida", () =>
    expect(validateDateOnly("2026-10-13")).toBe("2026-10-13"));
  it.each(["2026-02-30", "2026-13-01", "2026-1-1", "2026-10-12T00:00:00Z"])(
    "rejeita a data inválida %s",
    (value) => expect(() => validateDateOnly(value)).toThrow(),
  );
});
