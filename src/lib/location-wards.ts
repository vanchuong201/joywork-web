import api from "@/lib/api";

export type WardOption = {
  code: string;
  provinceCode: string;
  name: string;
  fullName: string | null;
  unitType: string | null;
};

export async function fetchWardsByProvinceCodes(provinceCodes: string[]): Promise<WardOption[]> {
  if (!provinceCodes.length) return [];
  const { data } = await api.get<{ data: { wards: WardOption[] } }>("/api/locations/wards", {
    params: { provinceCodes: provinceCodes.join(",") },
  });
  return data.data.wards;
}
