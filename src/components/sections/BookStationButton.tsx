"use client";

import { selectStation } from "@/lib/booking";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";

/** Scrolls to the booking form (via the anchor) and preselects this station there. */
export function BookStationButton({ stationId, stationName }: { stationId: number; stationName: string }) {
  return (
    <Button
      href="#booking"
      variant="secondary"
      className="w-full"
      aria-label={`Book ${stationName}`}
      onClick={() => selectStation(stationId)}
    >
      Book this station <ArrowRightIcon className="size-4" />
    </Button>
  );
}
