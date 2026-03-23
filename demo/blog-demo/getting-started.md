---
title: Getting Started with Tinyss
date: "2025-01-10"
tags:
  - tutorial
  - getting-started
---

A practical guide to building your first static site with Tinyss, from installation to deployment.

<!-- more -->

## Installation

First, make sure you have Node.js 22 or later installed. Then install Tinyss:

```shell
npm install -g create-tinyss
```

## Create Your Content

Create a directory structure for your site:

```
my-blog/
  config.yml
  index.md
  first-post.md
  about.md
```

## Configure Your Site

Add a `config.yml` with your site settings:

```yaml
title: My Blog
template: blog
```

## Build and Preview

Generate your static site:

```shell
tinyss my-blog/**/* -o output
```

Open the generated files in your browser to preview the result. Each markdown file becomes a beautifully rendered HTML page.

## Deploy

The output directory contains plain HTML, CSS, and JavaScript files. Deploy them to any static hosting provider like Netlify, Vercel, or GitHub Pages.
