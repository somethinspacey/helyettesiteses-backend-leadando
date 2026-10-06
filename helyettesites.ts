export interface Helyettesites {
  id: number;
  nev: string;
  ora: number;
  hetNapja: string;
}

export type UjHelyettesites = Omit<Helyettesites, "id">;
