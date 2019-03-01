#!/usr/bin/env node

/*
The following is a quick hack to implement a Node.js CLI tool that allows for starting one or more tasks based on the
output of another task.
 */

const shell = require('child_process');
const readline = require('readline');

const taskMap = {};

let startupMatchTimeout = null;
let startupMatchTimer = null;

function main(args) {
    let runConfig = processCmdLine(args);

    if (!runConfig) {
        process.exit(1);
    }

    runMasterTask(runConfig);

    // Propogate some signals to all child tasks.
    ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM'].forEach( signal => {
        process.on(signal, () => {
            signalTasks(runConfig.tasks, signal);
        });
    });
}

function processCmdLine(args) {
     let arguments = [];

    // Process all options
    for (let i = 0; i < args.length; i++) {
        if (/--startup-match-timeout=\d+$/.test(args[i])) {
            startupMatchTimeout = args[i].split('=')[1];
        } else if (args[i].startsWith('-')) {
            console.error(`Unknown option: ${args[i]}`);
            return null;
        } else {
            arguments.push(args[i]);
        }
    }

    if (arguments.length < 3) {
        console.error(`Missing arguments. Usage: runmon [--startup-match-timeout=<milliseconds>] <command> <pattern> <task> [<task> ...]`);
        return null;
    }

    return {
        cmd: arguments[0],
        pattern: new RegExp(arguments[1]),
        tasks: arguments.slice(2)
    }
}

function runMasterTask(runConfig) {
    let masterTask = shell.spawn(runConfig.cmd, {shell: true});

    // Process the master task's output line by line.
    let rl = readline.createInterface({
        input: masterTask.stdout
    });

    // Start the startup timer if that option was selected.
    if (startupMatchTimeout) {
        startupMatchTimer = setTimeout(() => {
            startupMatchTimer = null;
            runTasks(runConfig.tasks);
        }, startupMatchTimeout);
    }

    // Log every line received and check it against the provided pattern.
    // If a match is found, run the configured tasks.
    rl.on('line', line => {
        console.log(line);

        if (runConfig.pattern.test(line)) {
            // Stop the startup timer, if it's running.
            if (startupMatchTimer) {
                clearTimeout(startupMatchTimer);
                startupMatchTimer = null;
            }
            runTasks(runConfig.tasks);
        }
    });
}

function runTasks(tasks) {
    for (let i = 0; i < tasks.length; i++) {
        const taskid = `task${i}`;
        let task = taskMap[taskid];

        // Start the task only if it's not already running.
        if (typeof task === 'undefined') {
            task = shell.spawn(tasks[i], {stdio: "inherit", shell: true});
            taskMap[taskid] = task;

            // Make sure that upon task exit it is "cleared" from the task map.
            task.on('exit', () => {
                taskMap[taskid] = undefined;
            });
        }
    }
}

function signalTasks(tasks, signal) {
    for (let i = 0; i < tasks.length; i++) {
        const taskid = `task${i}`;
        let task = taskMap[taskid];

        if (typeof task !== 'undefined') {
            task.kill(signal);
        }
    }
}

main(process.argv.slice(2));
