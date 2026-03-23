---
title: Configuration
---

## Configuration Files

Tinyss reads configuration from YAML, TOML, or JSON files in your content directories. The most common pattern is a `config.yml` file.

## Available Options

### title

Sets the site or section title.

```yaml
title: My Documentation Site
```

### template

Specifies which template to use for rendering. Can be a built-in template name or a path to a custom template file.

```yaml
template: docs
```

Built-in templates: `default`, `docs`, `blog`, `marketing`, `portfolio`.

### outputDir

Sets the output directory for generated files.

```yaml
outputDir: public
```

## Frontmatter

Individual markdown files can include YAML frontmatter to override configuration:

```markdown
---
title: Custom Page Title
template: blog
---

Your content here...
```

## Directory Inheritance

Configuration cascades from parent to child directories. A child directory's config merges with and overrides its parent's config.

```
docs/config.yml          → applies to all docs
docs/guide/config.yml    → overrides for guide section
```
