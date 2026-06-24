import { useState, type JSX } from "react"
import "./tabs.css";

export interface TabbedPage {
  name: string;
  content: JSX.Element;
  icon: JSX.Element 
}

interface Props {
  pages: TabbedPage[];
}

export default function Tabs({pages}: Props) {
  const [activePage, setActivePage] = useState(0);

  const tabs = pages.map(({name, icon}, index) => {
    let className = "tab"

    if (index == activePage) {
      className += " active"
    }

    return (
      <div className={className} onClick={() => setActivePage(index)} key={`tab${index}-${name}`}>
        {icon}
        <p>{name}</p>
      </div>
    );
  });

  tabs.push(<div className="tab-filler" key={"tab-filler"}/>)

  return (
    <div>
      <div className="tab-row">
        {tabs}
      </div>
      <div className="tab-content">
        {pages[activePage].content}
      </div>
    </div>
  )
}
