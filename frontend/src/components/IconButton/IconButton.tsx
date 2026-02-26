import type { JSX } from "react";

interface Props {
  href: string;
  children: JSX.Element;
}

function IconButton({ href, children }: Props) {
  return (
    <a href={href} className="icon-btn" target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export default IconButton;
