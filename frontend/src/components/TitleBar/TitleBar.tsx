import { MenuRoute } from "../../types/MenuRoute";
import { Link } from "react-router";

import "./title-bar.css";

interface Props {
  route: MenuRoute;
  darkMode?: boolean;
  compact?: boolean;
}

export default function TitleBar({ darkMode = true, compact = false }: Props) {
  const buttons = Object.keys(MenuRoute)
    .filter((key) => key !== "home")
    .map((key) => MenuRoute[key])
    .sort((a, b) => (a.order > b.order ? 1 : -1))
    .map(({ title, route }) => (
      <Link to={route} key={`route-${title}`}>
        {title}
      </Link>
    ));

  const classNames = [];

  if (darkMode) {
    classNames.push("dark-mode");
  }
  if (compact) {
    classNames.push("compact");
  }

  return (
    <div id="title-bar-container" className={classNames.join(" ")}>
      <div id="logo-container">
        <Link id="logo" to="/">
          Maggie Lucy
        </Link>
        <Link id="logo-sub" to="/">
          Cinematographer
        </Link>
      </div>
      <div id="title-button-row">{buttons}</div>
    </div>
  );
}
