import { config, listFolders } from "../lib/d1";
import FolderExplorer from "./FolderExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!config()) {
    return (
      <main className="wrap">
        <header className="top">
          <div className="header-meta-side">
            <div className="terminal-brand">
              <span>[D1::OFFLINE]</span>
            </div>
          </div>
          <div className="header-title-block">
            <h1>Vault Folders</h1>
            <p>Database connection credentials missing.</p>
          </div>
        </header>
        <div className="warn-card">
          <h3>[CONFIG_REQUIRED]</h3>
          <p>
            Please set <code>CLOUDFLARE_ACCOUNT_ID</code>, <code>CLOUDFLARE_API_TOKEN</code>, and{" "}
            <code>CLOUDFLARE_D1_DATABASE_ID</code> on your Vercel Dashboard project settings.
          </p>
        </div>
      </main>
    );
  }

  let folders = [];
  let error = "";
  try {
    folders = await listFolders();
  } catch (err) {
    error = err.message || "Failed to query Cloudflare D1";
  }

  return (
    <main className="wrap">
      <FolderExplorer initialFolders={folders} error={error} />
    </main>
  );
}
