import { MenuRoute } from "~/types/MenuRoute";
import { Link } from "react-router";

interface Props {
  route: MenuRoute;
  darkMode?: boolean; 
}

export default function TitleBar({darkMode=false} : Props) {
  const buttons = Object.keys(MenuRoute).filter(
    key => key !== "home"
  ).map(
    key => MenuRoute[key]
  ).sort(
    (a, b) => a.order > b.order ? 1 : -1
  ).map(
    ({title, route}) => (<Link to={route}>{title}</Link>)
  )

  return (
    <div id="title-bar-container" className={darkMode ? "dark-mode" : ""}>
      <div id="logo-container">
        <Link id="logo" to="/">Maggie Lucy</Link>
        <Link id="logo-sub" to="/">Cinematographer</Link>
      </div>
      <div id="title-button-row">
        {buttons}
      </div>
    </div>
  )
}
