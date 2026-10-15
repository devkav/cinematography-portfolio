import "./admin-dashboard.css";

import { Link } from "react-router";
import UploadPanel from "../UploadPanel/UploadPanel";
import type { TabbedPage } from "../Tabs/Tabs";
import Tabs from "../Tabs/Tabs";
import AnalyticsDashboard from "../AnalyticsDashboard/AnalyticsDashboard";
import MailingList from "../MailingList/MailingList";
import { MdFileUpload, MdOutlineEmail, MdOutlineShowChart } from "react-icons/md";

export default function AdminDashboard({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  const pages: TabbedPage[] = [
    {
      name: "Analytics",
      content: <AnalyticsDashboard />,
      icon: <MdOutlineShowChart />
    },
    {
      name: "Upload",
      content: <UploadPanel />,
      icon: <MdFileUpload />
    },
    {
      name: "Mailing List",
      content: <MailingList />,
      icon: <MdOutlineEmail />
    }
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <Link id="logo" to="/">
          Maggie Lucy
        </Link>
        <div className="admin-header-right">
          <span>
            Signed in as <strong>{username}</strong>
          </span>
          <button className="admin-button-secondary" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <Tabs pages={pages} />
    </div>
  );
}
