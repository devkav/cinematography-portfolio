import { Link } from "react-router";
import Footer from "../components/Footer/Footer";
import { MenuRoute } from "../types/MenuRoute";
import "../styles/home.css";


export default function Home() {
  const buttons = Object.keys(MenuRoute).filter(
      key => key !== "home"
    ).map(
      key => MenuRoute[key]
    ).sort(
      (a, b) => a.order > b.order ? 1 : -1
    ).map(
      ({title, route}) => (<Link to={route} key={`route-${title}`}>{title}</Link>)
  )

  return (
    <div>
      <video autoPlay muted loop playsInline id="jumbo-video" src="https://d3amd0zp63qrni.cloudfront.net/assets/videos/landing-video.mp4"/>
      <div id="title-container">
        <h1 id="title" className="page-title">Maggie Lucy</h1>

        <div id="welcome-button-row">
          {buttons}
        </div>
      </div>

      <div id="footer-container">
        <Footer noCopyright/>
      </div>
    </div>
  )
}
