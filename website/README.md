# Website

This site is built with [Docusaurus](https://docusaurus.io/) and published to GitHub Pages on the `gh-pages` branch.

**Live URL:** https://thedev204.github.io/react-native-flash-reels/

## Local development

```bash
cd website
yarn
yarn start
```

## Build

```bash
cd website
yarn build
yarn serve
```

## Deploy

Pushing to `main` (when `website/**` changes) runs [.github/workflows/docs.yml](../.github/workflows/docs.yml), which builds the site and pushes the static output to the `gh-pages` branch.

You can also deploy manually from this folder:

```bash
GIT_USER=thedev204 yarn deploy
```

### One-time GitHub setup

1. Create the GitHub repo `thedev204/react-native-flash-reels` (if it does not exist yet) and push `main`.
2. Repo **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **gh-pages** / **/(root)**
3. After the first docs workflow run (or manual deploy), the site is available at the URL above.
