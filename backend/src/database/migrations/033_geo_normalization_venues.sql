-- Geo normalization: add PostGIS geom_point to venues so all geo queries
-- use the same indexed column type instead of split lat/lng.
-- Keeps lat/lng as cached fields for backward compatibility.

ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS geom_point geometry(Point, 4326);

UPDATE public.venues
SET geom_point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
WHERE geom_point IS NULL
  AND lat IS NOT NULL
  AND lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_venues_geom
ON public.venues USING GIST (geom_point);
