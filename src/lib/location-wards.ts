import api from "@/lib/api";
import { getProvinceDisplayLabel } from "@/lib/provinces";

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

export type HeadquartersAddressInput = {
  specificAddress?: string | null;
  wardCodes?: string[];
  location?: string | null;
  locationName?: string | null;
};

export function hasHeadquartersAddressData(input: HeadquartersAddressInput): boolean {
  return Boolean(
    input.specificAddress?.trim() ||
    input.location?.trim() ||
    (input.wardCodes?.[0]?.includes("/") ?? false),
  );
}

/** [địa chỉ chi tiết] - [phường/xã] - [tỉnh/thành] */
export function buildHeadquartersAddressLabel(
  input: HeadquartersAddressInput,
  wardByCode: Map<string, WardOption>,
): string | null {
  const parts: string[] = [];
  const specific = input.specificAddress?.trim();
  if (specific) parts.push(specific);

  const firstWard = input.wardCodes?.[0];
  if (firstWard?.includes("/")) {
    const wardInfo = wardByCode.get(firstWard);
    if (wardInfo) {
      parts.push(wardInfo.fullName ?? wardInfo.name);
    }
  }

  const provinceLabel =
    input.locationName?.trim() ||
    (input.location ? getProvinceDisplayLabel(input.location) : "");
  if (provinceLabel) parts.push(provinceLabel);

  return parts.length > 0 ? parts.join(" - ") : null;
}
