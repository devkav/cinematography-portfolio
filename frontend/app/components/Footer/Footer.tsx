import "~/components/Footer/footer.css"
import { FaInstagram, FaLinkedin } from "react-icons/fa";
import IconButton from "../IconButton/IconButton";
import { MdOutlineEmail } from "react-icons/md";


export default function Footer({darkMode} : {darkMode?: boolean}) {
    const currentTime = new Date()
    const year = currentTime.getFullYear()

    return (
        <div id="footer">
            <p>&#169; {year} Maggie Lucy</p>

            <div className={`icon-row ${darkMode ? "icon-row-dark" : ""}`}>
                <IconButton href="https://www.instagram.com/maggielucyscamera">
                    <FaInstagram/>
                </IconButton>
                <IconButton href="https://www.linkedin.com/in/maggie-lucy/">
                    <FaLinkedin/>
                </IconButton>
                <IconButton href="mailto:maggieclucy@gmail.com">
                    <MdOutlineEmail/>
                </IconButton>
            </div>
        </div>
    )
}