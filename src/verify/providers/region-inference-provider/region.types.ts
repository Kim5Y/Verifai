import { Region } from "./region.enums";

export type InferenceScores = Partial<Record<Region, number>>;
export type RegionConfidenceMap = Partial<Record<Region, number>>;
export type EvidenceMatch = {
  matchedValue: string;
  regions: ReadonlyArray<Region>;
};