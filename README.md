# Liam Benge portfolio

## Add photos and videos
Drop files into the folders under `media/`. Push to GitHub and the site rebuilds itself.
- Each folder becomes a hamburger menu item (slideshow + grid). Make a new folder to add a new menu item.
- Menu order is alphabetical, so use `01-`, `02-` prefixes. The prefix is hidden on the site.
- Photos: jpg, png, webp, gif, avif (resize to about 2000px wide first). Videos: mp4, webm, mov. Keep files under 100 MB.

## Banner
Save your banner as `assets/banner.jpg` (about 2400px wide).

## Publish on GitHub Pages
1. Create a repo, upload everything in this folder (including `.github`), push to `main`.
2. Repo Settings > Pages > Source: **GitHub Actions**.
3. Your site appears at `https://<username>.github.io/<repo>/`.

## Contact form
1. Make a free form at formspree.io, copy its ID.
2. In `contact.html`, replace `YOUR_FORM_ID` in the form action.

## Preview on your computer
`python build_manifest.py` then `python -m http.server`, open http://localhost:8000
# Portfolio
