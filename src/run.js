const core = require("@actions/core");
const childProcess = require("child_process");
const fs = require('fs');
const { promisify } = require("util");
const { awaitExecution } = require("./helpers");

const lstat = promisify(fs.lstat)

function buildSaucectlArgs(opts) {
    const args = ['run'];
    if (opts.configurationFile) {
        args.push('-c', opts.configurationFile);
    }
    if (opts.runRegion) {
        args.push('--region', opts.runRegion);
    }
    if (opts.runEnvironment) {
        args.push('--test-env', opts.runEnvironment);
    }
    if (opts.concurrency) {
        args.push('--ccy', opts.concurrency);
    }
    if (opts.suite) {
        args.push('--suite', opts.suite);
    }
    if (opts.timeout) {
        args.push('--timeout', opts.timeout);
    }
    if (opts.tunnelId) {
        args.push('--tunnel-id', opts.tunnelId);
    }
    if (opts.tunnelParent) {
        args.push('--tunnel-parent', opts.tunnelParent);
    }
    return args;
}

async function saucectlRun(opts) {
    const { workingDirectory } = opts;

    if (workingDirectory) {
        const stats = await lstat(workingDirectory);
        if (!stats.isDirectory()) {
            core.setFailed(`${workingDirectory} does not exists.`);
            return false;
        }
        process.chdir(workingDirectory);
    }

    core.info("Launching saucectl !");
    const saucectlArgs = buildSaucectlArgs(opts);
    core.info(`Command-line: saucectl ${saucectlArgs.join(" ")}`)

    const child = childProcess.spawn('saucectl', saucectlArgs, { env: { ...process.env, SAUCE_USERNAME: opts.sauceUsername, SAUCE_ACCESS_KEY: opts.sauceAccessKey }});
    const exitCode = await awaitExecution(child);

    if (exitCode != 0) {
        core.setFailed(`saucectl: Failure`);
        return false;
    }
    return true;
};

module.exports = { saucectlRun, awaitExecution, buildSaucectlArgs };