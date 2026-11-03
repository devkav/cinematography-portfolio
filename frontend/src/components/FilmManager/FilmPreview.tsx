import useElementWidth from "../../hooks/useElementWidth";
import FilmRow from "../FilmRow/FilmRow";
import type { FilmProject } from "../../types/Projects";

const VIDEOS_PER_ROW = 2;

export default function FilmPreview({ films }: { films: FilmProject[] }) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();

  const rows = Array.from({ length: Math.ceil(films.length / VIDEOS_PER_ROW) }, (_, row) =>
    films.slice(row * VIDEOS_PER_ROW, row * VIDEOS_PER_ROW + VIDEOS_PER_ROW)
  );

  return (
    <div className="film-manager-preview" ref={containerRef}>
      {width > 0 &&
        rows.map((row, index) => (
          <FilmRow
            key={`${index}-${row.map((film) => film.src).join("|")}`}
            videos={row}
            parentWidth={width}
            allLoadedCallback={() => {}}
          />
        ))}
    </div>
  );
}
