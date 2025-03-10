const core = require('@actions/core')

const opts = {
    path: process.env["INPUT_PATH"] || core.getInput("path", { required: true }),
    key: process.env["INPUT_KEY"] || core.getInput("key", { required: true }),
    injectVars: Boolean(process.env["INPUT_INJECT_ENV_VARS"]) || core.getBooleanInput("inject-env-vars", {required: false})
}

/* Placeholder object for parsed secrets after decryption */
const secretsTmp = {}
const dotenvPlain = {}

// Load up encryption key for CI secrets first
if (opts.key) {
    process.env["DOTENV_PRIVATE_KEY_CI"] = opts.key
    process.env["DOTENV_PRIVATE_KEY"] = opts.key
}

// do the secrets loader
require("dotenv").config({
    path: opts.path,
    processEnv: dotenvPlain,
    debug: core.isDebug() ? true : false
})
require("@dotenvx/dotenvx").config({
    path: opts.path,
    processEnv: secretsTmp,
    debug: core.isDebug() ? true : false
})

Object.keys(secretsTmp).forEach(key => {
    const value = secretsTmp[key]

    // warn user on failed-to-encrypt secrets
    if (value.startsWith("encrypted:")) {
        core.warning(`decryption failed for key ${key}, check your inputs/secrets`)
    }

    // Automatically mask decrypted secrets when prefixed with "encrypted:" using plain old dotenv pakcage
    if (dotenvPlain[key].startsWith("encrypted:") && !secretsTmp[key].startsWith("encrypted:")) {
        core.setSecret(value)
    }

    core.setOutput(key, value)
    
    if (opts.injectVars === true) {
        core.exportVariable(key, value);
    }
})

core.group("Parsed data (w/o decryption)", () => {
    core.info(JSON.stringify(dotenvPlain, null, 2))
})
core.group("dotenv-keys meta configs", () => {
    core.info(JSON.stringify({
        loaded: true,
        loader: "github-actions",
        last_loaded_dir: process.cwd()
    }, null, 2))
})

core.setOutput("DOTENV_KEYS_LOADER", "github-actions")
core.setOutput("DOTENV_KEYS_LOADED", "true")
core.setOutput("LAST_DOTENV_DIR", process.cwd())

if (opts.injectVars === true) {
    core.exportVariable("DOTENV_KEYS_LOADER", "github-actions")
    core.exportVariable("DOTENV_KEYS_LOADED", "true")
    core.exportVariable("LAST_DOTENV_DIR", process.cwd())
}