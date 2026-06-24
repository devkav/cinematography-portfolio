import type { ChangeEventHandler, ReactNode } from "react";
import "./dropdown.css";

interface Props {
  placeholder: string;
  options: string[];
  onChange: ChangeEventHandler;
}

export default function Dropdown({ placeholder, options, onChange }: Props) {
  const optionElements: ReactNode[] = options.map((option, index) => <option value={index} key={`dropdown-${index}`}>{option}</option>);

  return (
    <select className="mcl-dropdown" defaultValue={-1} onChange={onChange}>
      <option value={-1} disabled>
        {placeholder}
      </option>
      {optionElements}
    </select>
  );
}
