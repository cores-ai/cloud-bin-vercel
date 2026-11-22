import { config, listFolders } from "../lib/d1";
import FolderExplorer from "./FolderExplorer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!config()) {
    return (
      <main className="wrap">
        <header className="top">
          <div>
            <div className="badge-pill">Cloudflare D1</div>
            <h1>Document Folders</h1>
            <p>Database connection required</p>
          </div>
        </header>
        <div className="warn-card">
          <h3>Environment Variables Missing</h3>
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
    error = err.message || "Could not read from Cloudflare D1";
  }

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <div className="badge-pill">Cloudflare D1 &bull; doc-dustbin</div>
          <h1>Photo Vault Folders</h1>
          <p>{folders.length} archived folder{folders.length === 1 ? "" : "s"}</p>
        </div>
        <div className="server-status">
          <span className="dot live" />
          <span>Sync Active (IST)</span>
        </div>
      </header>

      {error ? (
        <div className="warn-card">
          <h3>Database Notice</h3>
          <p>{error}</p>
        </div>
      ) : null}

      <FolderExplorer initialFolders={folders} />
    </main>
  );
}
