import type { ChangeEventHandler, ReactNode } from "react"

interface Props {
  placeholder: string
  options: string[]
  onChange: ChangeEventHandler
}

export default function Dropdown({placeholder, options, onChange}: Props) {
  const optionElements: ReactNode[] = options.map((option, index) => (
    <option value={index}>{option}</option>
  ))

  return (
    <select defaultValue={-1} onChange={onChange}>
      <option value={-1} disabled>{placeholder}</option>
      {optionElements}
    </select>
  )
}
