import * as core from "@actions/core";
import dotenv from "dotenv";
import dotenvx from "@dotenvx/dotenvx";

function getBoolInputEnv() {
  const bool = process.env["INPUT_INJECT_ENV_VARS"];
  const trueValue = ["true", "True", "TRUE"];
  const falseValue = ["false", "False", "FALSE"];

  if (bool === undefined) {
    try {
      return core.getBooleanInput("inject-env-vars", { required: false });
    } catch (err) {
      core.warning(err instanceof Error ? err : String(err));
      return false;
    }
  }

  if (trueValue.includes(bool)) return true;
  if (falseValue.includes(bool)) return false;
}

const opts = {
  path: process.env["INPUT_PATH"] || core.getInput("path", { required: true }),
  key: process.env["INPUT_KEY"] || core.getInput("key", { required: true }),
  injectVars: getBoolInputEnv(),
};

core.group("options debug", async () => {
  core.debug(JSON.stringify(opts, null, 2));
  core.endGroup();
});

/* Placeholder object for parsed secrets after decryption */
const secretsTmp = Object.create(null);
const dotenvPlain = Object.create(null);
let failCount = 0;

// Load up encryption key for CI secrets first
if (opts.key) {
  core.debug("loading dotenvx private key as env var");
  process.env["DOTENV_PRIVATE_KEY_CI"] = opts.key;
  process.env["DOTENV_PRIVATE_KEY"] = opts.key;
}

// do the secrets loader
dotenv.config({
  path: opts.path,
  processEnv: dotenvPlain,
  debug: core.isDebug() ? true : false,
});
dotenvx.config({
  path: opts.path,
  processEnv: secretsTmp,
  debug: core.isDebug() ? true : false,
});

Object.keys(secretsTmp).forEach((key) => {
  const value = secretsTmp[key];
  const plainValue = dotenvPlain[key];
  const isEncryptedValue =
    typeof value === "string" && value.startsWith("encrypted:");
  const isEncryptedPlainValue =
    typeof plainValue === "string" && plainValue.startsWith("encrypted:");

  // warn user on failed-to-encrypt secrets
  if (isEncryptedValue) {
    core.warning(
      `decryption failed for key ${key}, check your inputs/secrets if key is correct`,
    );
    failCount++;
    core.debug(`fail count now at ${failCount}`);
  }

  // Automatically mask decrypted secrets when prefixed with "encrypted:" using plain old dotenv package
  if (isEncryptedPlainValue && !isEncryptedValue) {
    core.setSecret(value);
  }

  core.setOutput(key, value);

  if (opts.injectVars === true) {
    core.exportVariable(key, value);
  }
});

core.group("Parsed data (w/o decryption)", async () => {
  core.info(JSON.stringify(dotenvPlain, null, 2));
  core.endGroup();
});

core.group("dotenv-keys meta configs", async () => {
  core.info(
    JSON.stringify(
      {
        loaded: true,
        loader: "github-actions",
        last_loaded_dir: process.cwd(),
        decryption_failure: failCount > 0 || false,
        decryption_fail_count: failCount,
      },
      null,
      2,
    ),
  );
  core.endGroup();
});

core.setOutput("DOTENV_KEYS_LOADER", "github-actions");
core.setOutput("DOTENV_KEYS_LOADED", "true");
core.setOutput("LAST_DOTENV_DIR", process.cwd());
if (failCount > 0) {
  core.setOutput("DOTENV_DECRYPTION_FAILURE", "true");
  core.setOutput("DOTENV_DECRYPTION_FAIL_COUNT", failCount);
} else {
  core.setOutput("DOTENV_DECRYPTION_FAILURE", "false");
  core.setOutput("DOTENV_DECRYPTION_FAIL_COUNT", "0");
}

if (opts.injectVars === true) {
  core.exportVariable("DOTENV_KEYS_LOADER", "github-actions");
  core.exportVariable("DOTENV_KEYS_LOADED", "true");
  core.exportVariable("LAST_DOTENV_DIR", process.cwd());
  if (failCount > 0) {
    core.exportVariable("DOTENV_DECRYPTION_FAILURE", "true");
    core.exportVariable("DOTENV_DECRYPTION_FAIL_COUNT", failCount);
  } else {
    core.exportVariable("DOTENV_DECRYPTION_FAILURE", "false");
    core.exportVariable("DOTENV_DECRYPTION_FAIL_COUNT", "0");
  }
}
