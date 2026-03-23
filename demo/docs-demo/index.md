---
title: Getting Started
---

## Welcome to Tinyss

Tinyss is a tiny static site generator that works with zero configuration. Just point it at a directory of markdown files and get a beautiful website.

## Quick Start

Install tinyss and generate your first site in seconds:

```shell
npm init tinyss docs/**/* -o output
```

## How It Works

Tinyss operates on a simple principle: your file system is your site structure. Markdown files become HTML pages, and directory structure becomes URL structure.

### File Mapping

Given this input structure:

```
docs/index.md        → output/docs/index.html
docs/guide.md        → output/docs/guide/index.html
docs/style.css       → output/docs/style.css
```

### Configuration

Drop a `config.yml` in any directory to configure that section of your site. Subdirectories inherit parent configuration.

## Next Steps

Read the Installation guide for detailed setup instructions, or jump to the Configuration reference for all available options.
