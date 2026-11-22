import { config, listFolders } from "../lib/d1";
import FolderExplorer from "./FolderExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!config()) {
    return (
      <main className="wrap">
        <header className="top">
          <div>
            <div className="terminal-brand">
              <span>[D1::SYS_OFFLINE]</span>
              <span className="morse-code">--- ..-. ..-. .-.. .. -. .</span>
            </div>
            <h1>TERMINAL // VAULT</h1>
            <p>Database connection credentials missing.</p>
          </div>
        </header>
        <div className="warn-card">
          <h3>[ERR_ENV_MISSING]</h3>
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
      <header className="top">
        <div>
          <div className="terminal-brand">
            <span>[D1::DOC_DUSTBIN]</span>
            <span className="morse-code">-.-. .-.. --- ..- -..</span>
          </div>
          <h1>VAULT_FOLDERS // ARCHIVE</h1>
          <p>&gt; {folders.length} intake directories stored in D1 database</p>
        </div>
        <div className="sys-status-badge">
          <span className="status-blink" />
          <span>SYS.ONLINE // IST</span>
        </div>
      </header>

      {error ? (
        <div className="warn-card">
          <h3>[D1_DB_NOTICE]</h3>
          <p>{error}</p>
        </div>
      ) : null}

      <FolderExplorer initialFolders={folders} />
    </main>
  );
}
