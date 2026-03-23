---
title: Installation
---

## Requirements

Tinyss requires Node.js version 22 or later.

## Install via npm

The recommended way to install tinyss is via npm:

```shell
npm install -g create-tinyss
```

## Using npx

You can also run tinyss without installing it globally:

```shell
npx create-tinyss docs/**/* -o output
```

## Verify Installation

After installing, verify that tinyss is available:

```shell
tinyss --help
```

This should display the available commands and options.

## Project Setup

Create a new directory for your site and add some markdown files:

```shell
mkdir my-site
cd my-site
echo "# Hello World" > index.md
tinyss *.md -o output
```

Your generated site will be in the `output` directory.
