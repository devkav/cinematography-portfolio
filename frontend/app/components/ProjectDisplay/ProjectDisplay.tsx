interface ProjectDisplayData {
  id: number,
  src: string,
  title: string,
  subtitle: string,
  link?: string
}

interface Props {
  data: ProjectDisplayData;
}

export default function ProjectDisplay({data: { id, src, title, subtitle, link }}: Props) {
  let className = "project-display";

  if (link != undefined) {
    className += " clickable";
  }

  const onClick = () => {
    if (link != undefined) {
      window.open(link, "_blank");
    }
  }

  return (
    <div className={className} onClick={onClick}>
      <div className="project-display-label-container">
        <div className="project-display-label">
          <p className="project-display-title">{title}</p>
          <p className="project-display-subtitle">{subtitle}</p>
        </div>
      </div>
      <video autoPlay muted loop playsInline src={src}/>
    </div>
  );
}
