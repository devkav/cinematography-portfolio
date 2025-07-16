import "~/components/TitleBar/title-bar.css";
import { MenuRoute } from "~/types/MenuRoute";
import type { MenuRouteObj } from "~/types/MenuRoute";

interface Props {
  route: MenuRoute;
  darkMode?: boolean; 
}

export default function TitleBar({route: routeKey, darkMode=false} : Props) {
  const route: MenuRouteObj = MenuRoute[routeKey];
  const buttons = Object.keys(MenuRoute).filter(
    key => key !== routeKey
  ).map(
    key => MenuRoute[key]
  ).sort(
    (a, b) => a.order > b.order ? 1 : -1
  ).map(
    ({title, route}) => (<a href={route}>{title}</a>)
  )

  return (
    <div id="title-container" className={darkMode ? "dark-mode" : ""}>
      <h1 id="page-title">{route.title}</h1>
      <div id="title-button-row">
        {buttons}
      </div>
    </div>
  )
}
