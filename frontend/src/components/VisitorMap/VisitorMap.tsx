import "./visitor-map.css";

import { useEffect, useState, type PointerEvent } from "react";
import { geoIdentity, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, Geometry } from "geojson";
import useElementWidth from "../../hooks/useElementWidth";
import type { LabelledCount } from "../AnalyticsDashboard/AnalyticsDashboard";

export type MapView = "world" | "us";

interface Props {
  view: MapView;
  counts: LabelledCount[];
}

interface Region {
  key: string;
  name: string;
  feature: Feature<Geometry, { name: string }>;
}

const ASPECT_RATIOS: Record<MapView, number> = { world: 0.52, us: 0.62 };
const MIN_INTENSITY = 15;
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export default function VisitorMap({ view, counts }: Props) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [shapes, setShapes] = useState<{ view: MapView; regions: Region[] }>();
  const [active, setActive] = useState<{ region: Region; x: number; y: number }>();

  useEffect(() => {
    let cancelled = false;

    const load =
      view === "us"
        ? import("us-atlas/states-albers-10m.json").then((module) => {
            const topology = module.default as unknown as Topology<{
              states: GeometryCollection<{ name: string }>;
            }>;

            return feature(topology, topology.objects.states).features.map((state) => ({
              key: state.properties.name,
              name: state.properties.name,
              feature: state
            }));
          })
        : Promise.all([import("world-atlas/countries-110m.json"), import("i18n-iso-countries")]).then(
            ([module, isoCountries]) => {
              const topology = module.default as unknown as Topology<{
                countries: GeometryCollection<{ name: string }>;
              }>;

              return feature(topology, topology.objects.countries).features.map((country) => {
                const code = country.id !== undefined ? isoCountries.numericToAlpha2(country.id) : undefined;
                let name = country.properties.name;

                try {
                  name = code ? (regionNames.of(code) ?? name) : name;
                } catch {
                  name = country.properties.name;
                }

                return { key: code ?? country.properties.name, name, feature: country };
              });
            }
          );

    load.then((regions) => {
      if (!cancelled) setShapes({ view, regions });
    });

    return () => {
      cancelled = true;
    };
  }, [view]);

  const height = width * ASPECT_RATIOS[view];
  const regions = shapes?.view === view ? shapes.regions : [];
  const visitsByKey = new Map(counts.map(({ label, visits }) => [label, visits]));
  const max = Math.max(...counts.map(({ visits }) => visits), 1);

  const projection =
    view === "us"
      ? geoIdentity().fitSize([width, height], {
          type: "FeatureCollection",
          features: regions.map((region) => region.feature)
        })
      : geoNaturalEarth1().fitSize([width, height], { type: "Sphere" });
  const path = geoPath(projection);

  const fillFor = (visits: number) => {
    if (!visits) return undefined;

    const intensity = MIN_INTENSITY + (100 - MIN_INTENSITY) * Math.sqrt(visits / max);
    return `color-mix(in srgb, var(--analytics-accent) ${intensity}%, #1f1f1f)`;
  };

  const showTooltip = (event: PointerEvent<SVGPathElement>, region: Region) => {
    const bounds = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    setActive({ region, x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  };

  const activeVisits = active ? (visitsByKey.get(active.region.key) ?? 0) : 0;

  return (
    <div className="visitor-map" ref={containerRef}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={view === "us" ? "Visits by US state" : "Visits by country"}
          onPointerLeave={() => setActive(undefined)}
        >
          {view === "world" && <path className="visitor-map-sphere" d={path({ type: "Sphere" }) ?? ""} />}
          {regions.map((region) => {
            const visits = visitsByKey.get(region.key) ?? 0;

            return (
              <path
                key={region.key}
                className={`visitor-map-region${active?.region.key === region.key ? " active" : ""}`}
                d={path(region.feature) ?? ""}
                style={{ fill: fillFor(visits) }}
                tabIndex={visits ? 0 : undefined}
                aria-label={visits ? `${region.name}: ${visits} visits` : undefined}
                onPointerMove={(event) => showTooltip(event, region)}
                onFocus={() => {
                  const [x, y] = path.centroid(region.feature);
                  setActive({ region, x, y });
                }}
                onBlur={() => setActive(undefined)}
              />
            );
          })}
        </svg>
      )}
      {active && (
        <div
          className="chart-tooltip visitor-map-tooltip"
          style={{ left: Math.min(Math.max(active.x, 70), width - 70), top: active.y }}
        >
          <strong>
            {activeVisits.toLocaleString()} {activeVisits === 1 ? "visit" : "visits"}
          </strong>
          <span>{active.region.name}</span>
        </div>
      )}
      <div className="visitor-map-legend">
        <span>1</span>
        <div className="visitor-map-legend-ramp" />
        <span>{max.toLocaleString()} visits</span>
      </div>
    </div>
  );
}
