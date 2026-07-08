# Σοφία — The Philosophy Café · Publish Guide

All website files now live in the **`philosophy-cafe/`** folder. This guide shows
how to put it online so **anyone** can visit, post a comment (by signing in with
GitHub), and **everyone** can read each other's comments — including you, the
owner, who can moderate them.

The discussion runs on **Giscus**, which stores comments in your GitHub repo's
**Discussions**. No database, no server, no API keys to manage.

---

## Folder structure (what you are publishing)
```
philosophy-cafe/
├── index.html            ← redirects to the homepage (so the root URL works)
├── philosophycafe.html    ← THE homepage (the Café + discussion)
├── library.html           ← Library of resources
├── compose.html           ← Compose hub
├── philcafe.css           ← shared styles
├── page-script.js         ← shared scripts (sub-pages)
├── giscus-theme.css       ← parchment theme for the comments
├── SETUP.md               ← this file
├── thinkers/              ← 8 bio pages (Plato, Aristotle, …)
└── compose/               ← 5 writing-salon pages
```

---

## Step 1 — Create a public GitHub repository
1. Go to https://github.com/new
2. **Repository name:** anything, e.g. `philosophy-cafe`.
3. Set **Public**.
4. Leave "Add a README" unchecked (we already have files).
5. Click **Create repository**.

## Step 2 — Upload the website
On the new repo page, click **uploading an existing file** and drag in the
**contents of the `philosophy-cafe/` folder** (not the folder itself — the files
should sit at the repo's root). That keeps every link working.
- Required: `index.html`, `philosophycafe.html`, `philcafe.css`,
  `page-script.js`, `giscus-theme.css`, and the `thinkers/` + `compose/` folders.

## Step 3 — Turn on Discussions
- Repo → **Settings → General → Features** → tick **Discussions**.
- Add a category named exactly **`General`** (it must match `data-category` in the HTML).

## Step 4 — Install the Giscus app
- Go to https://github.com/apps/giscus → **Install** → choose this repo.

## Step 5 — Get your two IDs
- Go to https://giscus.app
- Enter your repo (`YOUR_USERNAME/philosophy-cafe`), pick category **General**.
- Copy the `data-repo-id="..."` and `data-category-id="..."` values shown.

## Step 6 — Fill the 4 placeholders in `philosophycafe.html`
Open `philosopycafe.html` (inside the folder) and edit the Giscus `<script>`.
Search for `OWNER/REPO` and replace these:

| In the HTML | Replace with |
|---|---|
| `data-repo="OWNER/REPO"` | `data-repo="YOUR_USERNAME/philosophy-cafe"` |
| `data-repo-id="REPO_ID"` | the `data-repo-id` from Step 5 |
| `data-category-id="CATEGORY_ID"` | the `data-category-id` from Step 5 |
| `data-theme="https://OWNER.github.io/REPO/giscus-theme.css"` | `https://YOUR_USERNAME.github.io/philosophy-cafe/giscus-theme.css` |

> Quick trick: use "Find & Replace" on `OWNER/REPO` → `YOUR_USERNAME/philosophy-cafe`
> (it appears in both `data-repo` and `data-theme`), then paste the two IDs.
>
> If you skip the custom theme, set `data-theme="preferred_color_scheme"` — it always works.

Commit the change back to the repo.

## Step 7 — Publish with GitHub Pages
- Repo → **Settings → Pages**.
- **Source:** Deploy from a branch → `main` → `/ (root)` → Save.
- Wait ~1 minute. Your live site is at:
  **`https://YOUR_USERNAME.github.io/philosophy-cafe/`**
  (`index.html` redirects to the homepage automatically.)

---

## How it works for visitors
- Anyone with the link can **read** all comments.
- To **post**, they click **Sign in with GitHub** at the top of the discussion.
- **You (owner)** see and moderate every comment in the repo's **Discussions**
  tab — reply, react, or delete.

## Two important rules
- The site must be opened through the **published URL**, not by double-clicking
  the file (`file://`). Comments only load over `http(s)`.
- Keep the repo **Public**, or Giscus can't read/write the comments.

## Optional — a separate thread on every page
Each sub-page already maps to its own thread via `data-mapping="pathname"`.
To enable comments there too, paste the same filled-in Giscus `<script>` block
near the end of each page's `<body>` (e.g. `library.html`, `thinkers/plato.html`).
