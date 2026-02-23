# brv-text-editor

A fully-functional React rich text editor and preview component inspired by Basecamp 3.
Built on [Tiptap](https://tiptap.dev/) (ProseMirror) + [Lucide React](https://lucide.dev/) icons.

---

## Features

| Feature | Details |
|---|---|
| **Formatting** | Bold, italic, underline, strikethrough, inline code |
| **Headings** | H1, H2, H3 via dropdown |
| **Lists** | Bullet, numbered, task (checkbox) lists |
| **Blocks** | Blockquote, fenced code block, horizontal rule |
| **Alignment** | Left, center, right text alignment |
| **Media** | Insert links (with edit/remove popover) and images by URL |
| **History** | Undo / Redo (⌘Z / ⌘⇧Z) |
| **Word count** | Live character and word count in the footer |
| **Preview** | `RichTextPreview` renders saved HTML in a Basecamp-style card with tabbed source view and emoji reactions |

---

## Installation

```bash
npm install brv-text-editor
```

> **Peer dependencies** – React 18+ must already be installed in your project.
> `react` and `react-dom` are **not** bundled inside the package.

```bash
# If you don't have React yet:
npm install react react-dom
```

---

## Quick start

### 1. Import the CSS (once, in your app entry)

```js
// main.jsx / main.tsx / _app.jsx
import 'brv-text-editor/dist/brv-text-editor.css'
```

### 2. Use the editor

```jsx
import { RichTextEditor } from 'brv-text-editor'

function MyPage() {
  const handleSave = (html) => {
    console.log('Saved HTML:', html)
    // send to your API, store in state, etc.
  }

  return (
    <RichTextEditor
      placeholder="Write something…"
      onSubmit={handleSave}
      submitLabel="Post note"
      showActions={true}
    />
  )
}
```

### 3. Show a preview after saving

```jsx
import { useState } from 'react'
import { RichTextEditor, RichTextPreview } from 'brv-text-editor'

const AUTHOR = { name: 'Jane Doe', initials: 'JD', avatarColor: '#1a6b3c' }

function NotesPage() {
  const [notes, setNotes] = useState([])

  const handleSave = (html) => {
    setNotes(prev => [
      { id: Date.now(), html, timestamp: new Date().toLocaleString() },
      ...prev,
    ])
  }

  return (
    <>
      <RichTextEditor onSubmit={handleSave} submitLabel="Post" showActions />

      {notes.map(note => (
        <RichTextPreview
          key={note.id}
          html={note.html}
          author={AUTHOR}
          timestamp={note.timestamp}
          onDismiss={() => setNotes(n => n.filter(x => x.id !== note.id))}
        />
      ))}
    </>
  )
}
```

---

## API

### `<RichTextEditor />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `initialContent` | `string` | `''` | Initial HTML content loaded into the editor |
| `placeholder` | `string` | `'Write something…'` | Placeholder shown when editor is empty |
| `onChange` | `(html: string) => void` | — | Called on every change with the current HTML |
| `onSubmit` | `(html: string) => void` | — | Called when the submit button is clicked |
| `onCancel` | `() => void` | — | Called when the cancel button is clicked |
| `submitLabel` | `string` | `'Save'` | Label for the submit button |
| `showActions` | `boolean` | `true` | Whether to show the footer Save/Cancel bar |
| `minHeight` | `number` | `140` | Minimum editor height in pixels |
| `autofocus` | `boolean` | `false` | Whether to focus the editor on mount |

### `<RichTextPreview />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `html` | `string` | `''` | Raw HTML string to render |
| `author` | `{ name, initials, avatarColor? }` | `{ name:'Anonymous', initials:'A' }` | Author info shown in the card header |
| `timestamp` | `string` | `''` | Human-readable timestamp string |
| `onDismiss` | `() => void` | — | If provided, shows a × button to remove the card |
| `showReactions` | `boolean` | `true` | Whether to show the emoji reactions row |
| `reactions` | `string[]` | `['👍','❤️','🎉','🙌']` | Emoji list for the reactions row |

---

## Publishing for your company

You have two options: a **private npm registry** (recommended) or a **direct Git dependency**.

---

### Option A — Private npm registry (recommended)

This is the cleanest approach. Developers run a single `npm install` and get the package like any other.

#### Step 1 — Set up a registry

Choose one:

| Option | Notes |
|---|---|
| **GitHub Packages** | Free for private repos; scoped package (`@your-org/brv-text-editor`). Good if you already use GitHub. |
| **npm private registry** | Paid; works with unscoped names. |
| **Verdaccio** (self-hosted) | Free, runs on your own server/container. Full npm protocol compatible. |
| **AWS CodeArtifact / JFrog** | Enterprise options; cost depends on usage. |

#### Step 2 — Scope the package (recommended for private registries)

In `package.json`, rename to a scoped name:

```json
{
  "name": "@your-org/brv-text-editor"
}
```

This prevents name collisions with the public registry.

#### Step 3 — Authenticate and publish

**GitHub Packages example:**

```bash
# 1. Create a Personal Access Token (PAT) with write:packages scope on GitHub

# 2. Login to the GitHub registry
npm login --registry=https://npm.pkg.github.com --scope=@your-org

# 3. Build the library
npm run build:lib

# 4. Publish
npm publish --registry=https://npm.pkg.github.com
```

**Verdaccio example:**

```bash
# 1. Start Verdaccio (or point to your hosted instance)
npx verdaccio   # → http://localhost:4873

# 2. Create an account (first time only)
npm adduser --registry http://localhost:4873

# 3. Build and publish
npm run build:lib
npm publish --registry http://localhost:4873
```

#### Step 4 — Configure developers' machines

Developers need to tell npm where to find your scoped packages.
Create or update `.npmrc` in their project (or the monorepo root):

```ini
# .npmrc – checked into source control
@your-org:registry=https://npm.pkg.github.com
# or for Verdaccio:
# @your-org:registry=http://your-verdaccio-host:4873
```

They also need to authenticate once:

```bash
npm login --registry=https://npm.pkg.github.com --scope=@your-org
```

For CI/CD, use an automation token stored as a secret:

```ini
# .npmrc in CI environment
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
@your-org:registry=https://npm.pkg.github.com
```

#### Step 5 — Developers install and use it

```bash
npm install @your-org/brv-text-editor
```

```jsx
import '@your-org/brv-text-editor/dist/brv-text-editor.css'
import { RichTextEditor, RichTextPreview } from '@your-org/brv-text-editor'
```

#### Step 6 — Publishing updates

```bash
# Bump the version (choose: patch | minor | major)
npm version patch

# Rebuild and publish
npm run build:lib && npm publish --registry <your-registry-url>
```

Use semantic versioning:
- `patch` (1.0.1) — bug fixes
- `minor` (1.1.0) — new features, backwards-compatible
- `major` (2.0.0) — breaking changes

---

### Option B — Git dependency (no registry needed)

If you just want to share quickly within your organization without setting up a registry, push the repo to your internal Git host and developers install directly from Git:

```bash
npm install git+https://github.com/your-org/brv-text-editor.git
# or SSH:
npm install git+ssh://git@github.com/your-org/brv-text-editor.git
```

**Important:** The `dist/` folder must be committed to the repo for this to work, because npm won't run `build:lib` automatically on install.

```bash
# Before pushing for the first time (and after each release):
npm run build:lib
git add dist/
git commit -m "chore: rebuild dist for v1.0.x"
git push
```

To pin to a specific version, use a tag:

```bash
# Tag a release
git tag v1.0.1
git push origin v1.0.1

# Install that exact tag
npm install git+https://github.com/your-org/brv-text-editor.git#v1.0.1
```

---

## Local development / testing the library

```bash
# In this repo — build the library and create a local link
npm run build:lib
npm link

# In your consumer app's folder
npm link brv-text-editor   # or @your-org/brv-text-editor
```

Or use `npm pack` to simulate exactly what gets published:

```bash
npm pack
# → brv-text-editor-1.0.0.tgz

# In your consumer app:
npm install /path/to/brv-text-editor-1.0.0.tgz
```

---

## Project structure

```
rich-text-editor/
├── dist/                         ← Library output (git-ignored for private registry flow)
│   ├── brv-text-editor.es.js     ← ES module bundle
│   ├── brv-text-editor.umd.js    ← UMD/CJS bundle
│   └── brv-text-editor.css       ← Extracted stylesheet
├── src/
│   ├── index.js                  ← Library entry (exports both components)
│   ├── index.css                 ← All styles (ProseMirror + preview)
│   ├── components/
│   │   ├── RichTextEditor.jsx    ← Editor component
│   │   └── RichTextPreview.jsx   ← Preview card component
│   ├── App.jsx                   ← Demo application
│   └── main.jsx                  ← Demo entry point
├── vite.config.js                ← Demo app Vite config
├── vite.lib.config.js            ← Library build Vite config
└── package.json
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the demo app dev server |
| `npm run build` | Build the demo app |
| `npm run build:lib` | Build the distributable library → `dist/` |
| `npm run preview` | Preview the built demo app |

---

## License

MIT
