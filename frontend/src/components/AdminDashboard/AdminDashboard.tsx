import "./admin-dashboard.css";

import { Link } from "react-router";
import UploadPanel from "../UploadPanel/UploadPanel";
import type { TabbedPage } from "../Tabs/Tabs";
import Tabs from "../Tabs/Tabs";
import AnalyticsDashboard from "../AnalyticsDashboard/AnalyticsDashboard";
import { MdFileUpload, MdOutlineShowChart } from "react-icons/md";

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
