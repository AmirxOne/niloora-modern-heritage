"use client";

import { useCallback, useEffect, useState } from "react";
import type { PublicCampaignDto } from "@/lib/types/campaign";
import { parseJsonResponse } from "./fetch-utils";

export function useActiveCampaigns() {
  const [campaigns, setCampaigns] = useState<PublicCampaignDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/campaigns/active");
      if (!response.ok) {
        setCampaigns([]);
        return;
      }
      const data = await parseJsonResponse<{ campaigns: PublicCampaignDto[] }>(response);
      setCampaigns(data?.campaigns ?? []);
    } catch {
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { campaigns, isLoading, reload: load };
}

export function useCampaignBySlug(slug: string | null) {
  const [campaign, setCampaign] = useState<PublicCampaignDto | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(slug));

  useEffect(() => {
    if (!slug) {
      setCampaign(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetch(`/api/campaigns/${encodeURIComponent(slug)}`)
      .then((response) => (response.ok ? parseJsonResponse<{ campaign: PublicCampaignDto }>(response) : null))
      .then((data) => setCampaign(data?.campaign ?? null))
      .catch(() => setCampaign(null))
      .finally(() => setIsLoading(false));
  }, [slug]);

  return { campaign, isLoading };
}
