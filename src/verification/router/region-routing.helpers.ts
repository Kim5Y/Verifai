import { Region } from '../../verify/providers/region-inference-provider/region.enums';
import { REGION_FALLBACKS, REGION_PRIORITY } from './region-priority.constants';

export interface RegionCandidate {
  region: Region;
  confidence: number;
}

export function buildRegionCandidates(
  confidenceByRegion: Partial<Record<Region, number>>,
): RegionCandidate[] {
  const candidates: RegionCandidate[] = [];

  for (const [regionKey, confidenceValue] of Object.entries(
    confidenceByRegion,
  )) {
    const region = regionKey as Region;
    const confidence = Number(confidenceValue);
    if (!Number.isFinite(confidence)) continue;
    if (confidence <= 0) continue;
    candidates.push({ region, confidence });
  }

  return candidates;
}

export function rankRegionCandidates(
  candidates: readonly RegionCandidate[],
): RegionCandidate[] {
  return [...candidates].sort((left, right) => {
    const leftPriority = REGION_PRIORITY[left.region] ?? 0;
    const rightPriority = REGION_PRIORITY[right.region] ?? 0;
    if (leftPriority !== rightPriority) return rightPriority - leftPriority;
    return right.confidence - left.confidence;
  });
}

export function expandWithFallbackRegions(
  rankedCandidates: readonly RegionCandidate[],
): RegionCandidate[] {
  const expandedCandidates: RegionCandidate[] = [];
  const seenRegions = new Set<Region>();

  for (const candidate of rankedCandidates) {
    if (!seenRegions.has(candidate.region)) {
      expandedCandidates.push(candidate);
      seenRegions.add(candidate.region);
    }

    const fallbackRegions = REGION_FALLBACKS[candidate.region] ?? [];
    for (const fallbackRegion of fallbackRegions) {
      if (seenRegions.has(fallbackRegion)) continue;
      expandedCandidates.push({ region: fallbackRegion, confidence: candidate.confidence });
      seenRegions.add(fallbackRegion);
    }
  }

  return expandedCandidates;
}
