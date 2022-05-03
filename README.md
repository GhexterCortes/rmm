# rmm

<img src="https://i.imgur.com/q327Zzq.png" align="right" height="100">

Reciple module manager `rmm` is a tool for managing and installing Reciple modules. It's based from [Axis module utility](https://github.com/GhexterCortes/axis-module-utility).

## Installation

To install rmm run

```bash
npm i -g rmm
```

## Commands

```bash
$ rmm help
These are the available commands:
    add <module>
    clearcache
    help [command]
    init-module
    init
    list [filter]
    pack [output-dir] [overwrite:BOOLEAN]
    remove <module> [confirm:BOOLEAN]
    version

Use rmm help <command> to see help for a specific command
```

## Downloading Reciple Modules

In your Reciple bot root directory you can install Reciple modules by running.

> All valid module must have a `.reciple` file.

```bash
rmm add <module.zip|github/repo>
```

Installing from zip

```bash
rmm add ./module.zip
```

Installing from github. You can also specify a tag you want to download.

> The repository must be a public repository. With at least one tag.

```bash
rmm add GhexterCortes/reciple-test-module
```

## Creating Module

To create a module initialize your `.reciple` file with this command:

> It will ask you information about your module. You can skip this step if you want to edit your `.reciple` file manually.

```bash
rmm init-module
```

To pack your module to zip file go to your module root directory and run:

```bash
rmm pack
```

with out dir

```
rmm pack ../module.zip
```

with overwrite

```bash
rmm pack ./ true
```

## Module in Github

To publish your module to github you need to create a repository and add a `.reciple` file.