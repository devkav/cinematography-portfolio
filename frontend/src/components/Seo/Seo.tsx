const SITE_NAME = "Maggie Lucy";
const SITE_URL = "https://maggieclucy.com";

interface Props {
  title: string;
  description: string;
  path: string;
}

export default function Seo({ title, description, path }: Props) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
    </>
  );
}
