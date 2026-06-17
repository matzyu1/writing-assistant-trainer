# Writing Assistant Trainer

Writing Assistant Trainer is a static browser app for improving the knowledge files used by a personal Custom GPT writing assistant. It helps collect safe demo writing scenarios, compare generated output with improved versions, and export updated markdown knowledge files.

![Writing Assistant Trainer visual guide](assets/writing-assistant-trainer.gif)

<p>
  <a href="https://writing.matt-yu.com/custom-gpt-export.html" target="_blank" rel="noopener noreferrer">
    Check out my work here!
  </a>
</p>

## Problem It Solves

Custom GPTs do not automatically learn from a user's corrections. This project gives the user a structured loop for improving writing quality without uploading private documents into the public web app.

The app helps the user:

- Identify which document types need more examples.
- Pick safe training scenarios for each writing type.
- Generate a prompt to test in a Custom GPT.
- Paste the GPT output and a better human-edited version.
- Save correction notes and banned patterns.
- Rebuild six local markdown knowledge files for manual upload to the Custom GPT.

## Key Features

- Knowledge Trainer with document-type scenarios.
- GTP Training Loop Progress tracker.
- Scenario picker with completed markers.
- Quality Check for generated knowledge files.
- Six markdown knowledge file previews and downloads.
- Optional browser folder sync through the File System Access API.
- No backend, database, API key, or environment variables.

## How The Trainer Works

1. Open GTP Training Loop Progress and check which document types are weak.
2. Choose a matching document type in Knowledge Trainer.
3. Pick a scenario.
4. Copy the generated prompt into your Custom GPT.
5. Paste the GPT output back into the trainer.
6. Paste an improved version and add notes, corrections, or banned patterns.
7. Save the example.
8. Download or sync the updated knowledge files.
9. Manually upload the updated files to the Custom GPT.

Repeat the loop until each document type has enough strong examples.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Browser `localStorage`
- Static markdown file generation in the browser

## Live Demo

Live demo:

`https://writing.matt-yu.com/custom-gpt-export.html`

## Portfolio Case Study Note

This project can be presented as a portfolio case study about designing a practical AI workflow tool. The focus is not the model itself, but the surrounding product system: feedback collection, scenario coverage, safe export checks, and repeatable knowledge-file improvement.

## Privacy Note

This repository should only include safe demo scenarios and app code. Do not commit private writing samples, job applications, personal documents, credentials, API keys, exported knowledge files containing private details, or sensitive Custom GPT instructions.

## Run Locally

Because the app is fully static, it can be opened through any local static server:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/custom-gpt-export.html
```

## GitHub Pages

The repository can be deployed from the `main` branch using GitHub Pages. The root `index.html` redirects to the trainer page.
