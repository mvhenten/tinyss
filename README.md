## Tinyss

A tiny static site generator, with zero configuration.

[![build status](https://github.com/mvhenten/tinyss/actions/workflows/node.js.yml/badge.svg)](https://github.com/mvhenten/tinyss/actions/workflows/node.js.yml)

## Usage

Generate a static site from a directory containing markdown files to `output`:

```shell
npm init tinyss doc/**/* -o output
```

## Configuration

Tinyss operates over a list of files, and apllies configs and templates from the containing directory.
Subdirectories inherit configuration.

- A file like `name.md` is rendered to `name/index.html`
- Config-like files (yaml, toml, json) are read and added to the context.
- Custom templates may be defined in config or added to the directory.
- All other files (CSS, javascript, images, fonts, ...) are copied over to the output directory.
- Plugins can be enabled in `tinyss.config.json` with `"plugins": ["excerpts", "rss"]`.

Given the following input:

```
doc/config.toml
doc/template.hbs
doc/style.css
doc/index.md
doc/contributing.md
```

Tinyss would render the following files using `template.hbs` and additional context from `config.toml`:

```
doc/style.css       --> output/doc/style.css
doc/index.md        --> output/doc/index.html
doc/contributing.md --> output/doc/contributing/index.html
```

## Motivation

This is a hobby project - mostly playing around with node 20+ features - and exploring the small complexties of a simple idea: a static site generator that works with zero configuration.
