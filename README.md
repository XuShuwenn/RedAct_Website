# RedAct Website

Static project website scaffold for **RedAct: Redacting Agent Capability Traces for Procedural Skill Protection**.

## Sections

The first version is organized around the release story:

1. Hero: project name, claim, paper/code links, and headline numbers.
2. Problem: public traces improve auditability but leak procedural skills.
3. Method: key-item localization, owner review, selective rewriting, behavioral watermarking.
4. Benchmark: CapTraceBench task/skill/domain coverage.
5. Results: raw trace leakage, RedAct protection, release integrity, provenance watermarks.
6. Resources: code, benchmark, paper, and citation.

## Local Preview

Open `index.html` directly in a browser, or serve the directory with any static file server:

```bash
python -m http.server 8080
```

## Deployment

The directory is ready for GitHub Pages. Push it to a repository or publish it from a `docs/` branch/folder, then update the placeholder paper and code URLs in `index.html`.
