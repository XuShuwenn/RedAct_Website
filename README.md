# RedAct Website

Static project website scaffold for **RedAct: Redacting Agent Capability Traces for Procedural Skill Protection**.

## Links

- Paper: [arXiv:2606.10813](https://arxiv.org/abs/2606.10813)
- Code: [XuShuwenn/RedAct](https://github.com/XuShuwenn/RedAct)

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

The directory is ready for GitHub Pages. Push it to a repository or publish it from a `docs/` branch/folder. The paper URL should point to [arXiv:2606.10813](https://arxiv.org/abs/2606.10813), and the code URL should point to [XuShuwenn/RedAct](https://github.com/XuShuwenn/RedAct).

## Citation

```bibtex
@misc{xu2026redactredactingagentcapability,
  title={RedAct: Redacting Agent Capability Traces for Procedural Skill Protection},
  author={Shuwen Xu and Zhitao He and Yi R. and Fung},
  year={2026},
  eprint={2606.10813},
  archivePrefix={arXiv},
  primaryClass={cs.CR},
  url={https://arxiv.org/abs/2606.10813},
}
```
