import { FaInstagram, FaLinkedin } from "react-icons/fa";
import IconButton from "../IconButton/IconButton";
import { MdOutlineEmail } from "react-icons/md";

import "./footer.css";

export default function Footer({ darkMode = true, noCopyright }: { darkMode?: boolean; noCopyright?: boolean }) {
  const currentTime = new Date();
  const year = currentTime.getFullYear();

  return (
    <div id="footer">
      {!noCopyright && <p className={darkMode ? "dark" : ""}>&#169; {year} Maggie Lucy</p>}

      <div className={`icon-row ${darkMode ? "icon-row-dark" : ""}`}>
        <IconButton href="https://www.instagram.com/maggielucyscamera">
          <FaInstagram />
        </IconButton>
        <IconButton href="https://www.linkedin.com/in/maggie-lucy/">
          <FaLinkedin />
        </IconButton>
        <IconButton href="mailto:maggieclucy@gmail.com">
          <MdOutlineEmail />
        </IconButton>
      </div>
    </div>
  );
}
