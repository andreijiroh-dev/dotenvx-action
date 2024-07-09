# `@andreijiroh-dev/dotenvx-action` - dotenvx GitHub Actions integration

Securely inject your dotenvx secrets without the leaks on GitHub Actions job
logs, powered by [`@dotenvx/dotenvx`][dotenvx] Node.js library.

[dotenvx]: https://github.com/dotenvx/dotenvx

## Requirements

In order for this to work, you need to commit your `.env.ci` file, but you must
encrypt secrets using [`dotenvx`][dotenvx] CLI first to avoid leakage.

```bash
# For example, encrypt your API tokens (you may need --encrypt flag if CLI version < 1.0.0 )
dotenvx set -f .env.ci -- RHQCR_BOT_PASSWORD patops_1234abcd...

# If it is harmless to commit, add --plain flag (otherwise do not add any flags if CLI version < 1.0.0)
dotenvx set -f .env.ci --plain -- RHQCR_BOT_USERNAME andreijiroh-dev+buildops
```

> [!WARNING]
> Remember to add `.env.keys` to your `.gitignore` file to avoid potential leakage of private keys.

## Usage

```yaml
- uses: andreijiroh-dev/dotenvx-action@v0.2.0 # change main to a tagged version
  id: dotenvx
  with:
    path: path/to/dotenv-file # defaults to .env.ci unles specified
    # either one of those are required
    key: ${{ secrets.DOTENV_PRIVATE_KEY_CI }} # for .env.ci
    # optional if you need them in scripts involve requiring access to secrets via env vars
    inject-env-vars: "true"

- run: gh auth status
  env:
    GITHUB_TOKEN: ${{ steps.dotenvx.outputs.GITHUB_TOKEN }}
```

### Inputs

| Name              | Default       | Description                                                                |
| ----------------- | ------------- | -------------------------------------------------------------------------- |
| `path`            | `.env.ci`     | Path to dotenv file to decrypt its encrypted secrets |
| `key`             |               | Value of `DOTENV_PRIVATE_KEY_CI` from your `.env.keys` file (or another).  |
| `inject-env-vars` | `false`       | Injects decrypted secrets as env vars if set to `true` for subsequent jobs |

### Outputs

Alongside any parsed secrets (whether decrypted or not), the following outputs/variables are adapted from
the [`dotenv-keys`][dotenv-keys] bash shell hook and function developed by Andrei Jiroh:

[dotenv-keys]: <https://github.com/andreijiroh-dev/dotenvx-secretstore/blob/main/contrib/shell-hooks/dotenv-keys.bashrc>

| Name                 | Description                                                                                         | Default Value             |
| -------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- |
| `DOTENV_KEYS_LOADER` | The method used by dotenv keys loader to load private key into the current GitHub Actions job.      | `github-actions`          |
| `DOTENV_KEYS_LOADED` | Operates similarly to `CI` and friends, signals other programs that `DOTENV_PRIVATE_KEY` are loaded | `true`                    |
| `LAST_DOTENV_DIR`    | The last directory where `env.keys` are loaded into the workflow (or in this case, the secrets)     | Based off `process.cwd()` |

## License

MIT
