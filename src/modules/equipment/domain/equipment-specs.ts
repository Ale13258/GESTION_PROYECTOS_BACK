export type EquipmentSpecs = {
  caudal: string | null;
  potencia: number | null;
  voltaje: string | null;
  rpm: number | null;
  material: string | null;
  garantia: string | null;
  entregaDias: number | null;
  cumplimiento: number | null;
};

export const emptySpecs = (): EquipmentSpecs => ({
  caudal: null,
  potencia: null,
  voltaje: null,
  rpm: null,
  material: null,
  garantia: null,
  entregaDias: null,
  cumplimiento: null,
});
