import { useEffect, useState } from "react";
import { EventData, EventListResponse, fetchEvents } from "../utils/api";

export function useEvents(filters?: {
  city?: string;
  state?: string;
  category?: string;
  event_type?: string;
  search?: string;
  refreshKey?: number;
}) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEvents({ ...filters, page_size: 200 })
      .then((data: EventListResponse) => {
        if (!cancelled) {
          setEvents(data.items);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load events. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [filters?.city, filters?.state, filters?.category, filters?.event_type, filters?.search, filters?.refreshKey]);

  return { events, total, loading, error };
}
