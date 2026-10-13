# AnimeKurd PWA

1. Put the Speda Bold font at `fonts/Speda-Bold.woff2` (and optionally `.ttf`). Until then Tahoma is used.
2. Push this folder to a GitHub repo → Settings → Pages → deploy from branch (root).
3. Open the site over HTTPS; the browser will offer "Install app".

Notes
- Data is stored in each visitor's own browser (localStorage). Use Admin → Export JSON, then
  replace `data/anime.json` and bump `VERSION` in `sw.js` to ship the catalog to everyone.
- The Admin button is not password-protected (static site = no real security). Anyone can edit their own local copy only.
- Some hosts block embedding in iframes; use the host's official "embed" URL.
