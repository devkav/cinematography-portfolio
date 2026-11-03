import type { JSX } from "react";
import "./tabs.css";

export interface TabbedPage {
  id: string;
  name: string;
  content: JSX.Element;
  icon: JSX.Element;
}

interface Props {
  pages: TabbedPage[];
  active: string | null;
  onChange: (id: string) => void;
}

export default function Tabs({ pages, active, onChange }: Props) {
  const activePage = Math.max(
    0,
    pages.findIndex(({ id }) => id === active)
  );

  const tabs = pages.map(({ id, name, icon }, index) => {
    let className = "tab";

    if (index == activePage) {
      className += " active";
    }

    return (
      <div className={className} onClick={() => onChange(id)} key={`tab${index}-${name}`}>
        {icon}
        <p>{name}</p>
      </div>
    );
  });

  tabs.push(<div className="tab-filler" key={"tab-filler"} />);

  return (
    <div>
      <div className="tab-row">{tabs}</div>
      <div className="tab-content">{pages[activePage].content}</div>
    </div>
  );
}
