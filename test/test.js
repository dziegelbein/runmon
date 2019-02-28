const fs = require('child_process');
const assert = require('assert');

const cmd = `node ./index.js`;

describe(`runmon should error when...`, function() {
    // Each of the tests in this context should complete very quickly, so
    // use a short timeout for them all.
    this.timeout(1000);

    function assertIsMissingArguments(cmdResult) {
        assert.ok(cmdResult);
        assert.strictEqual(cmdResult.status, 1);
        assert.strictEqual(cmdResult.stdout.toString(), ``);
        assert.ok(cmdResult.stderr.toString().startsWith(`Missing arguments`));
    }

    function assertHasUnknownOption(cmdResult) {
        assert.ok(cmdResult);
        assert.strictEqual(cmdResult.status, 1);
        assert.strictEqual(cmdResult.stdout.toString(), ``);
        assert.ok(cmdResult.stderr.toString().startsWith(`Unknown option`));
    }

    it(`called with no arguments.`, function() {
        assertIsMissingArguments(
            fs.spawnSync(cmd, {shell: true})
        );
    });

    it(`called with one non-option argument.`, function() {
        assertIsMissingArguments(
            fs.spawnSync(`${cmd} node`, {shell: true})
        );
    });

    it(`called with two non-option arguments.`, function() {
        assertIsMissingArguments(
            fs.spawnSync(`${cmd} node test`, {shell: true})
        );
    });

    it(`called with only one option argument.`, function() {
        assertIsMissingArguments(
            fs.spawnSync(`${cmd} --startup-match-timeout=1000`, {shell: true})
        );
    });

    it(`called with one option argument and one non-option argument.`, function() {
        assertIsMissingArguments(
            fs.spawnSync(`${cmd} --startup-match-timeout=1000 node`, {shell: true})
        );
    });

    it(`called with one option argument and two non-option arguments.`, function() {
        assertIsMissingArguments(
            fs.spawnSync(`${cmd} --startup-match-timeout=1000 node test`, {shell: true})
        );
    });

    it(`called with an incomplete startup match timeout option (missing equals sign).`, function() {
        assertHasUnknownOption(
            fs.spawnSync(`${cmd} --startup-match-timeout`, {shell: true})
        );
    });

    it(`called with an incomplete startup match timeout option (includes equals sign).`, function() {
        assertHasUnknownOption(
            fs.spawnSync(`${cmd} --startup-match-timeout=`, {shell: true})
        );
    });

    it(`called with a negative value for startup match timeout.`, function() {
        assertHasUnknownOption(
            fs.spawnSync(`${cmd} --startup-match-timeout=-1`, {shell: true})
        );
    });

    it(`called with a non-numeric value for startup match timeout.`, function() {
        assertHasUnknownOption(
            fs.spawnSync(`${cmd} --startup-match-timeout=bad`, {shell: true})
        );
    });
});

describe(`runmon should succeed when...`, function() {
    let shortRunCommand=`node -e \\"console.log('cmdout')\\"`;
    let multiOutCommand=`node -e \\"console.log('cmdout\\ncmdout')\\"`;
    let longRunCommand=`node -e \\"setTimeout(()=>{console.log('cmdout')}, 1000)\\"`;
    let patternNoMatch=`no match`;
    let patternMatch=`cmdout`;
    let task1=`node -e \\"console.log('task1')\\"`
    let task2=`node -e \\"console.log('task2')\\"`

    // By default, use a short timeout for tests. This is overridden in specific
    // tests where necessary.
    this.timeout(2000);

    function assertSuccess(cmdResult) {
        assert.ok(cmdResult);
        assert.strictEqual(cmdResult.status, 0);
        assert.strictEqual(cmdResult.stderr.toString(), ``);
    }

    function assertNoMatch(cmdResult) {
        assertSuccess(cmdResult);
        assert.strictEqual(cmdResult.stdout.toString(), `cmdout\n`);
    }

    function assertMatch(cmdResult) {
        assertSuccess(cmdResult);
        // Output order can vary depending on process timing, so these
        // checks account for that.
        assert.ok(/^(cmdout\n|task1\n){2}$/m.test(cmdResult.stdout.toString()));
        assert.ok(/cmdout\n/m.test(cmdResult.stdout.toString()));
        assert.ok(/task1\n/m.test(cmdResult.stdout.toString()));
    }

    function assertMultiMatch(cmdResult) {
        assertSuccess(cmdResult);
        // Output order can vary depending on process timing, so these
        // checks account for that.
        assert.ok(/^(cmdout\n|task1\n){3}$/m.test(cmdResult.stdout.toString()));
        assert.ok(/^(task1\n){0,2}cmdout\n(task1\n){0,2}$/m.test(cmdResult.stdout.toString()));
    }

    function assertMatch2(cmdResult) {
        assertSuccess(cmdResult);
        // Output order can vary depending on process timing, so these
        // checks account for that.
        assert.ok(/^(cmdout\n|task1\n|task2\n){3}$/m.test(cmdResult.stdout.toString()));
        assert.ok(/cmdout\n/m.test(cmdResult.stdout.toString()));
        assert.ok(/task1\n/m.test(cmdResult.stdout.toString()));
        assert.ok(/task2\n/m.test(cmdResult.stdout.toString()));
    }

    //== SHORT-RUN COMMAND TESTS
    it(`called with a short-run command and a single task, no match.`, function() {
        assertNoMatch(
            fs.spawnSync(`${cmd} "${shortRunCommand}" "${patternNoMatch}" "${task1}"`, {shell: true})
        )
    });

    it(`called with a short-run command and a single task, single match.`, function() {
        assertMatch(
            fs.spawnSync(`${cmd} "${shortRunCommand}" "${patternMatch}" "${task1}"`, {shell: true})
        )
    });

    it(`called with a short-run command and a single task, multi-match.`, function() {
        assertMultiMatch(
            fs.spawnSync(`${cmd} "${multiOutCommand}" "${patternMatch}" "${task1}"`, {shell: true})
        )
    });

    it(`called with a short-run command and multiple tasks, no match.`, function() {
        assertNoMatch(
            fs.spawnSync(`${cmd} "${shortRunCommand}" "${patternNoMatch}" "${task1}" "${task2}"`, {shell: true})
        )
    });

    it(`called with a short-run command and multiple tasks, single match.`, function() {
        assertMatch2(
            fs.spawnSync(`${cmd} "${shortRunCommand}" "${patternMatch}" "${task1}" "${task2}"`, {shell: true})
        )
    });

    it(`called with a short-run command and a single task, with timeout.`, function() {
        assertMatch(
            fs.spawnSync(`${cmd} --startup-match-timeout=1 "${shortRunCommand}" "${patternNoMatch}" "${task1}"`, {shell: true})
        )
    });

    it(`called with a short-run command and a single task, with timeout, multi-match.`, function() {
        assertMatch(
            fs.spawnSync(`${cmd} --startup-match-timeout=1 "${multiOutCommand}" "${patternNoMatch}" "${task1}"`, {shell: true})
        )
    });

    it(`called with a short-run command and multiple tasks, with timeout.`, function() {
        assertMatch2(
            fs.spawnSync(`${cmd} --startup-match-timeout=1 "${shortRunCommand}" "${patternNoMatch}" "${task1}" "${task2}"`, {shell: true})
        )
    });

    //== LONG-RUN COMMAND TESTS
    it(`called with a long-run command and a single task, no match.`, function() {
        assertNoMatch(
            fs.spawnSync(`${cmd} "${longRunCommand}" "${patternNoMatch}" "${task1}"`, {shell: true})
        )
    });

    it(`called with a long-run command and a single task, single match.`, function() {
        assertMatch(
            fs.spawnSync(`${cmd} "${longRunCommand}" "${patternMatch}" "${task1}"`, {shell: true})
        )
    });

    it(`called with a long-run command and multiple tasks, no match.`, function() {
        assertNoMatch(
            fs.spawnSync(`${cmd} "${longRunCommand}" "${patternNoMatch}" "${task1}" "${task2}"`, {shell: true})
        )
    });

    it(`called with a long-run command and multiple tasks, single match.`, function() {
        assertMatch2(
            fs.spawnSync(`${cmd} "${longRunCommand}" "${patternMatch}" "${task1}" "${task2}"`, {shell: true})
        )
    });

    it(`called with a long-run command and a single task, with timeout.`, function() {
        assertMatch(
            fs.spawnSync(`${cmd} --startup-match-timeout=1 "${longRunCommand}" "${patternNoMatch}" "${task1}"`, {shell: true})
        )
    });

    it(`called with a long-run command and multiple tasks, with timeout.`, function() {
        assertMatch2(
            fs.spawnSync(`${cmd} --startup-match-timeout=1 "${longRunCommand}" "${patternNoMatch}" "${task1}" "${task2}"`, {shell: true})
        )
    });
});

