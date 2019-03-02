# runmon
> Run a command and perform tasks based on that command's output.

This is a Node.js CLI tool for running a command, monitoring its output, and then running one or more other tasks 
every time a line of the command's output matches a pattern.


## Installation

```sh
npm install runmon --save-dev
```

## Usage

```sh
runmon [options] <command> <pattern> <task> [<task> ...]

Runs <command>, and when <pattern> appears in a line of the command's stdout, runs the <task>(s).

options:
	--startup-match-timeout=<milliseconds>
		Run the task(s) if <milliseconds> from command startup elapses with no output matching the pattern.
```

NOTES: 
  The pattern can be a regular expression, e.g. "matchme$" matches only on a line where "matchme" is at the end.
  Pattern matching is performed on a line-by-line basis; consequently, you cannot match text across lines.
  The tasks are run every time a line of stdout matches the pattern; however, if a task is already running, another 
  instance of that task is NOT started.

## Example

To start nodemon after 'tsc -w' is done compiling (assumes you have a script labeled nodemon):

In your package.json scripts section:

```sh
"dev": "runmon \"tsc -w\" \"Found 0 errors.\" \"npm run nodemon\""
```

## Release History

* 0.2.2
    * Corrected version number in package-lock.json. Minor tweak to head comment in index.js.
* 0.2.1
    * Fixed issue with premature termination of the primary task. Minor refactoring to address cross-platform
    testing issues.
* 0.2.0
    * Changed --startup-match-timeout option to be of the form option=value. Added tests to the module. Other minor
    refactorings.
* 0.1.0
    * Initial release

## Why

The motivation for creating this tool came out of my search for a reliable cross-platform way to order the execution of 
tasks around the Typescript compiler running in watch mode (tsc -w). Specifically, I wanted to ensure I could run tasks 
after, and only after, the compiler finished compiling. There are, no doubt, other ways to solve this problem, but I 
wanted something simple that didn't add too much to a project's dev dependencies.

For reference: https://github.com/Microsoft/TypeScript/issues/12996

## Meta

Dan Ziegelbein – github-email@dan.ziegelbein.me

Distributed under the ISC license. See ``LICENSE`` for more information.

[https://github.com/dziegelbein/runmon](https://github.com/dziegelbein/)
