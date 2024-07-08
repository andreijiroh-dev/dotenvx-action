const core = require('@actions/core')

const opts = {
    path: process.env["INPUT_PATH"] || core.getInput("path", { required: true }),
    key: process.env["INPUT_KEY"] || core.getInput("key", { required: false }),mainKey: process.env["INPUT_MAIN_KEY"] || core.getInput("main-key", { required: false }),
    injectVars: Boolean(process.env["INPUT_INJECT_ENV_VARS"]) || core.getBooleanInput("inject-env-vars", {required: false})
}

const secretsTmp = {}
const dotenvPlain = {}

if (opts.key == "" && opts.mainKey == "") {
    core.setFailed("Missing parameter: either key or main-key")
    process.exit()
}

// Load up encryption key for CI secrets first
if (opts.key) {
    process.env["DOTENV_PRIVATE_KEY_CI"] = opts.key
}

// If we have the encryption key for the main .env file, load it up also there.
if (opts.mainKey) {
    process.env["DOTENV_PRIVATE_KEY"] = opts.mainKey
}

// do the secrets loader
const { config } = require("@dotenvx/dotenvx")
require("dotenv").config({
    path: opts.path,
    processEnv: dotenvPlain,
    debug: core.isDebug() ? true : false
})

const dotenvx = config({
    path: opts.path,
    processEnv: secretsTmp,
    debug: core.isDebug() ? true : false
})

if (dotenvx.error) {
    core.error(dotenvx.error)
    process.exit(1)
}

Object.keys(secretsTmp).forEach(key => {
    const value = secretsTmp[key]

    // warn user on failed-to-encrypt secrets
    if (value.startsWith("encrypted:")) {
        core.warning(`decryption failed for key ${key}, check your inputs/secrets`)
    }

    // Automatically mask decrypted secrets when prefixed with "encrypted:" using plain old dotenv pakcage
    if (dotenvPlain[key].startsWith("encrypted:")) {
        core.setSecret(value)
    }

    core.setOutput(key, value)
    
    if (opts.injectVars === true) {
        core.exportVariable(key, value);
    }
})

core.setOutput("DOTENV_KEYS_LOADER", "github-actions")
core.setOutput("DOTENV_KEYS_LOADED", "1")
core.setOutput("LAST_DOTENV_DIR", process.cwd())

if (opts.injectVars === true) {
    core.exportVariable("DOTENV_KEYS_LOADER", "github-actions")
    core.exportVariable("DOTENV_KEYS_LOADED", "1")
    core.exportVariable("LAST_DOTENV_DIR", process.cwd())
}