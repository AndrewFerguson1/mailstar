# Mailstar

Mailstar is a fast, focused email command center built around one idea: spend less time managing your inbox and more time answering what matters.

## What is included

- A responsive three-pane mailbox for desktop and a native-feeling mobile flow
- Inbox, starred, snoozed, sent, drafts, and archive views
- Search across people, addresses, subjects, previews, and labels
- Smart filters for unread, important, and attachment-bearing messages
- Read/unread, star, archive, snooze, delete, reply, and compose actions
- A command palette and keyboard-first navigation
- Local persistence for mailbox state between browser sessions
- Accessible controls, dialogs, focus states, and reduced-motion support
- Unit coverage for mailbox filtering, searching, state transitions, and stats
- Automated lint, test, and production build checks on every push to `main`

## Run locally

Requirements: Node.js 22 or newer and npm 10 or newer.

```bash
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173/mailstar/`.

## Quality checks

```bash
npm run check
```

This runs ESLint, Vitest, and the production Vite build in sequence.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `⌘/Ctrl + K` | Open quick actions |
| `/` | Focus search |
| `C` | Compose a message |
| `R` | Reply to the open message |
| `E` | Archive the open message |
| `S` | Star or unstar the open message |
| `J` / `K` | Move down / up through messages |
| `Esc` | Close the active overlay |

## Architecture

Mailstar is a React 19 single-page application built with Vite 8. Mailbox rules live in pure functions under `src/lib/mailbox.js`, keeping filtering and state transitions independently testable. The main application composes small UI components in `src/App.jsx`; seeded demo content lives separately in `src/data/emails.js`. No backend or credentials are required for the product demo.

State is saved to browser `localStorage`. Clear the keys beginning with `mailstar-` to reset the demo inbox.

## Continuous integration

The workflow in `.github/workflows/deploy.yml` installs from the lockfile and runs the complete quality gate on every push and pull request targeting `main`. The Vite base path remains configured for the `mailstar` repository, so the built `dist` directory is ready for GitHub Pages whenever Pages is enabled in the repository settings.

## License

MIT © Andrew Ferguson
