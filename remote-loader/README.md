# Remote `dotenvx` loader

Loads `dotenvx`-encrypted secrets from a remote URL and decrypts them using a provided private key by combining both steps into one composite action.

This is useful if you want to store your encrypted dotenv files in a separate repository or service, and load them dynamically during your CI/CD workflows.

Note that releases for this action follow the same release cycle and cadence as the main action itself.

## Prerequisites

The only prerequisites to use this composite action are `jq` (for parsing JSON) and `curl` (for fetching remote files), both of which are pre-installed in the default GitHub Actions runners.

## Usage

```yaml
- uses: andreijiroh-dev/dotenvx-action/remote-loader@v0.4.0 # change this to latest tagged version or use commit hashes
  id: dotenvx
  with:
    url: raw-url-here
    key: ${{ secrets.DOTENV_PRIVATE_KEY_CI }} # for .env.ci
    # optional if you need them in scripts involve requiring access to secrets via env vars
    # inject-env-vars: "true"

# To access the resulting outputs, use the `fromJson` function to parse the JSON-encoded output.
- name: Workaround for accessing outputs as JSON
  run: gh auth status
  env:
    GH_PAT: ${{ fromJson(steps.dotenvx.outputs.DOTENV_RESULT).GH_PAT }}
```

### Inputs

Other than [the regular options in the main action itself](../README.md#inputs), the only difference is the `url` input:

| Input            | Required | Description                                                                                     |
| ---------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `url`            | Yes      | The raw URL to the dotenvx-encrypted file (e.g. from a repo). |

Because this action fetches the dotenv file from a remote URL, you may need to ensure that the URL is accessible from the GitHub Actions runner environment (or utilize Actions secrets for adding URLs with any sensitive information in it, e.g. API keys in URL parameters).

### Outputs

Other than the regular outputs in the main action itself, this action also provides:

| Output               | Description                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| `DOTENV_RESULT`      | JSON-encoded result of the dotenvx decryption operation, use `fromJson` to access them. |

## License

MIT
