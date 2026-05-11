# Fitbook

Fitbook is an H5/Web prototype for the Zhihu Hackathon project 「知识历险」.

It helps users start from one Zhihu article, move through a 10-step guided knowledge adventure, and save the final route as a shareable knowledge playlist.

## Run

```bash
npm run build:standalone
```

Then open:

```text
dist/demo.html
```

If local port listening is available:

```bash
npm run dev
```

## Notes

- The current demo uses mock data to guarantee a stable hackathon presentation.
- Sensitive local notes and API materials under `note/` are intentionally excluded from Git.
- See [PROJECT_GUIDE.md](PROJECT_GUIDE.md) for the file structure, deployment flow, update log, and documentation maintenance rules.
