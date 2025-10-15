interface ProjectDisplayData {
  id: number,
  src: string,
  title: string,
  subtitle: string,
  link?: string,
  laurels?: any[];
}

interface Props {
  data: ProjectDisplayData;
  onLoadCallback: () => void;
}

export default function ProjectDisplay({data: { id, src, title, subtitle, link, laurels=[] }, onLoadCallback}: Props) {
  let className = "project-display";

  if (link != undefined) {
    className += " clickable";
  }

  const onClick = () => {
    if (link != undefined) {
      window.open(link, "_blank");
    }
  }

  const onLoad = () => {
    onLoadCallback();
  }

  return (
    <div className={className} onClick={onClick}>
      <div className="project-display-label-container">
        {laurels.map((laurel, index) => <img className="project-display-laurel" src={laurel} key={`laurel-${id}-${index}`}/>)}
        <div className="project-display-label">
          <p className="project-display-title">{title}</p>
          <p className="project-display-subtitle">{subtitle}</p>
        </div>
      </div>
      <video autoPlay muted loop playsInline onLoadedData={onLoad} src={src}/>
    </div>
  );
}
