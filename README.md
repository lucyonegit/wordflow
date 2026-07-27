# Wordflow

An experimental structured-script editor built with Lexical, React, Ant Design, and Zustand.

Unlike a generic rich-text editor, Wordflow explores text that carries timeline and semantic structure: scenes, words, gaps, playback position, search ranges, and synchronized highlighting.

## What is implemented

- Custom Lexical nodes for scenes, word groups, words, and gaps.
- Structured editor state loaded from typed mock transcript data.
- Timeline position stored in Zustand and updated through playback controls.
- Search with previous/next navigation and CSS Highlight API rendering.
- Cursor-aware search result navigation.
- Event handling for structured gaps and word interactions.
- Highlight plugins that react to the current playback position.

## Data flow

```text
Structured transcript data
          │
          ▼
   Custom Lexical nodes
          │
          ├── event handling
          ├── search ranges
          └── timeline highlighting
                    │
                    ▼
               Editor UI
```

## Project structure

```text
src/pages/editor/
  nodes/       Scene, word, content, and gap node definitions
  plugins/     Event, highlight, and search behavior
  index.tsx    Lexical composition and timeline controls
src/mock/      Structured example transcript data
src/store/     Shared playback state
```

## Run locally

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run lint
npm run preview
```

## Status

Wordflow is a focused editor prototype. Its current data model and plugins are intended for experimentation with script/transcript workflows, not as a production-ready general-purpose rich-text package.
