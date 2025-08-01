import "~/components/TitleBar/title-bar.css";
import { MenuRoute } from "~/types/MenuRoute";

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
    ({title, route}) => (<a href={route}>{title}</a>)
  )

  return (
    <div id="title-container" className={darkMode ? "dark-mode" : ""}>
      <div id="logo-container">
        <a id="logo" href="/">Maggie Lucy</a>
      </div>
      <div id="title-button-row">
        {buttons}
      </div>
    </div>
  )
}
