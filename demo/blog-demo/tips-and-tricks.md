---
title: Tips and Tricks for Better Static Sites
date: "2025-02-20"
tags:
  - tips
  - performance
  - templates
---

Practical advice for getting the most out of your Tinyss static site, from content organization to template customization.

<!-- more -->

## Organize Your Content

A well-structured content directory makes maintenance easier as your site grows. Group related pages into subdirectories and use consistent naming conventions. For a blog, date-prefixed filenames help keep things in order. For documentation, number your sections.

Keep your frontmatter consistent across pages. Define a standard set of fields (title, date, tags) and use them everywhere. This makes it easier to build listings, navigation, and search features later.

## Choose the Right Template

Tinyss ships with four stock templates, each designed for a specific use case:

- **docs** — Sidebar navigation with table of contents, ideal for technical documentation
- **blog** — Post listings with excerpts and reading time, built for writing
- **marketing** — Hero sections and feature grids for landing pages
- **portfolio** — Project cards in a responsive grid layout

You can also create custom templates using Preact components. Templates receive the page title, rendered HTML body, site config, and a list of all pages in the site.

## Leverage Plugins

The built-in plugin system extends your site with minimal effort. The `excerpts` plugin automatically extracts preview text from your posts using the `<!-- more -->` marker. The `toc` plugin generates a table of contents from your headings. The `pages` plugin gives every template access to the full list of pages for building navigation and listings.

Plugins hook into the build lifecycle at four points: before parsing, after parsing, before rendering, and after rendering. This gives you control over content transformation at every stage.
