/**
 * Motor simplificado de nómina: parámetros fiscal / IMSS configurables
 * (tasas editables = "actualizaciones" cuando cambien normativas).
 */
export type ParametrosNomina = {
  porcentajeIsr: number;
  porcentajeImssEmpleado: number;
  bonificaciones: number;
  otrasDeducciones: number;
};

export type LineaNominaCalculada = {
  salarioBase: number;
  bonificaciones: number;
  deducciones: number;
  salarioNeto: number;
  desglose: {
    isr: number;
    imss: number;
    otrasDeducciones: number;
  };
};

export function calcularLineaNomina(
  salarioBase: number,
  params: ParametrosNomina
): LineaNominaCalculada {
  const bruto = salarioBase + params.bonificaciones;
  const isr = round2((bruto * params.porcentajeIsr) / 100);
  const imss = round2((bruto * params.porcentajeImssEmpleado) / 100);
  const otras = round2(params.otrasDeducciones);
  const deducciones = round2(isr + imss + otras);
  const salarioNeto = round2(bruto - deducciones);

  return {
    salarioBase: round2(salarioBase),
    bonificaciones: round2(params.bonificaciones),
    deducciones,
    salarioNeto,
    desglose: { isr, imss, otrasDeducciones: otras }
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
