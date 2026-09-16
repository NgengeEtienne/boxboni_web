import raw from "@/lib/data/cameroon-locations.json";

interface Division {
  name: string;
  subdivisions: string[];
}

interface Region {
  name: string;
  divisions: Division[];
}

const REGIONS = raw as Region[];

export function listRegions(): string[] {
  return REGIONS.map((r) => r.name);
}

export function listDivisions(regionName: string): string[] {
  const region = REGIONS.find((r) => r.name === regionName);
  return region ? region.divisions.map((d) => d.name) : [];
}

export function listSubdivisions(regionName: string, divisionName: string): string[] {
  const region = REGIONS.find((r) => r.name === regionName);
  const division = region?.divisions.find((d) => d.name === divisionName);
  return division ? division.subdivisions : [];
}
