# Vercel folders

This is the viewer. The Railway bot writes each submission into Cloudflare D1. This app reads that same database and shows one folder per submission.

The folder name is the short mailbox name, because a full email does not fit on a folder. The full email, India date, India time, and both photos are inside the folder.

## Env

Use the same values as the Railway bot:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_D1_DATABASE_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_OWNER_IDS` = `8344952568,7562427494`

The page only uses the three Cloudflare variables. The Telegram values are kept so both projects carry the same env.

## Deploy

1. Push this folder as its own repo.
2. Import it in Vercel.
3. Add the env vars.
4. Deploy. Framework is Next.js. Root directory is this folder.
