import "./admin-dashboard.css";

import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import UploadPanel from "../UploadPanel/UploadPanel";
import type { TabbedPage } from "../Tabs/Tabs";
import Tabs from "../Tabs/Tabs";
import AnalyticsDashboard from "../AnalyticsDashboard/AnalyticsDashboard";
import MailingList from "../MailingList/MailingList";
import { MdFileUpload, MdOutlineEmail, MdOutlineShowChart } from "react-icons/md";

const SAVED_SEARCH_KEY = "admin-search";
const TAB_SEARCH_PARAM_NAME = "tab";
const VIEW_SEARCH_PARAM_NAME = "view";
const UPLOAD_TAB = "upload";

const readSavedSearch = () => {
  try {
    return localStorage.getItem(SAVED_SEARCH_KEY) ?? "";
  } catch {
    return "";
  }
};

export default function AdminDashboard({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = searchParams.size > 0 ? searchParams : new URLSearchParams(readSavedSearch());

  useEffect(() => {
    if (searchParams.size === 0) {
      const savedSearch = readSavedSearch();
      if (savedSearch) setSearchParams(savedSearch, { replace: true });
      return;
    }

    try {
      localStorage.setItem(SAVED_SEARCH_KEY, searchParams.toString());
    } catch {
      return;
    }
  }, [searchParams]);

  const pages: TabbedPage[] = [
    {
      id: "analytics",
      name: "Analytics",
      content: <AnalyticsDashboard />,
      icon: <MdOutlineShowChart />
    },
    {
      id: UPLOAD_TAB,
      name: "Upload",
      content: (
        <UploadPanel
          selected={params.get(VIEW_SEARCH_PARAM_NAME)}
          onSelect={(view) => setSearchParams({ [TAB_SEARCH_PARAM_NAME]: UPLOAD_TAB, [VIEW_SEARCH_PARAM_NAME]: view })}
        />
      ),
      icon: <MdFileUpload />
    },
    {
      id: "mailing-list",
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
      <Tabs
        pages={pages}
        active={params.get(TAB_SEARCH_PARAM_NAME)}
        onChange={(tab) => setSearchParams({ [TAB_SEARCH_PARAM_NAME]: tab })}
      />
    </div>
  );
}
