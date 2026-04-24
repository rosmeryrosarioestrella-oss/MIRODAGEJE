import { calcularLineaNomina } from "./nominaCalculo";

describe("calcularLineaNomina", () => {
  it("calcula deducciones y neto con ISR e IMSS", () => {
    const r = calcularLineaNomina(10000, {
      porcentajeIsr: 10,
      porcentajeImssEmpleado: 3.5,
      bonificaciones: 500,
      otrasDeducciones: 200
    });
    expect(r.salarioBase).toBe(10000);
    expect(r.bonificaciones).toBe(500);
    expect(r.desglose.isr).toBe(1050);
    expect(r.desglose.imss).toBe(367.5);
    expect(r.desglose.otrasDeducciones).toBe(200);
    expect(r.deducciones).toBe(1617.5);
    expect(r.salarioNeto).toBe(8882.5);
  });
});
