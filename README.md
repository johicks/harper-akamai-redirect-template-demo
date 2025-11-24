# Harper Akamai Redirect Template

This repo is a template for running redirect logic on **Akamai EdgeWorkers** while delegating actual redirect decisions to a separate **Harper Redirect** API.

On each request, an EdgeWorker calls Harper; if Harper returns a redirect URL, the EdgeWorker issues an HTTP redirect, otherwise traffic goes to the origin normally.

---

## Architecture

> TODO: Replace Images

![High-level redirect flow](https://placehold.co/800x260?text=High-level+redirect+flow)

![EdgeWorker ↔ Harper detail](https://placehold.co/800x260?text=EdgeWorker+%E2%86%94+Harper+detail)

---

## Repository Layout

- `akamai/bootstrap-config.json` – Configuration settings for bootstrap GitHub Actions workflow.
- `akamai/edgeworker/main.js` – EdgeWorker entrypoint; calls Harper and issues redirects.
- `akamai/property/harper-redirect-template.v1.default.json` – base Akamai Property Manager rules.
- `.github/workflows/bootstrap-akamai.yml` – GitHub Actions workflow to bootstrap Akamai Edgeworker, Property, and Harper redirect Application
- `redirects/redirects.json` – Redirects file for Harper Redirect App.
- `.github/workflows/harper-redirect-update.yml` - Github Actions workflow that uploads redirects.json to Harper Redirect App on repo commit.

---

## `akamai/bootstrap-config.json`

```json
{
  "akamai_account": {
    "contractId": "",
    "groupId": ""
  },
  "akamai_edgeworker": {
    "create": true,
    "name": "harper-redirector-ew",
    "resourceTierId": 200,
    "harperRedirectBaseUrl": "https://harper-redirects.akamaized.net/checkredirect"
  },
  "akamai_property": {
    "create": true,
    "productId": "prd_Fresca",
    "network": "enhancedTLS",
    "name": "harper-redirect-ew-subrequests",
    "edgeHostname": "harper-redirects.akamaized.net",
    "cnameTarget": "harper-redirects.akamaized.net",
    "originHostname": "harper.staging.example.com",
    "sendHostHeader": "harper.staging.example.com"
  },
  "harper_app": {
    "uploadRedirectJSON": true
  }
}
```

### Sections

| Path              | Description                                      |
|-------------------|--------------------------------------------------|
| `akamai_account`  | Contract and group ID for your Akamai account. |
| `akamai_edgeworker` | EdgeWorker creation + Harper base URL.        |
| `akamai_property` | Property creation and hostname/origin settings. |
| `harper_app`      | Optional Harper app–specific flags.             |

### `akamai_account`

| Key         | Example     | Notes                           |
|-------------|-------------|---------------------------------|
| `contractId`| `C-1ED34DY` | Contract used by PAPI/PM APIs. |
| `groupId`   | `265792`    | Group where the property and Edgeworker will live. |

### `akamai_edgeworker`

| Key                   | Example                                               | Notes                                                   |
|-----------------------|-------------------------------------------------------|---------------------------------------------------------|
| `create`              | `true`                                               | If `false`, EdgeWorker registration steps are skipped.  |
| `name`                | `harper-redirector-ew`                               | Display name for the EdgeWorker.                        |
| `resourceTierId`      | `200`                                                | Resource tier for limits/capacity.                      |
| `harperRedirectBaseUrl` | `https://harper-redirects.akamaized.net/checkredirect` | Base URL for the Harper redirect API; injected into JS. |

### `akamai_property`

| Key             | Example                              | Notes                                                                 |
|-----------------|--------------------------------------|-----------------------------------------------------------------------|
| `create`        | `true`                               | If `false`, property-related steps are skipped.                       |
| `productId`     | `prd_Fresca`                         | Akamai product backing the property (see below).                      |
| `network`       | `enhancedTLS`                        | When `enhancedTLS`, workflow creates a secure property.               |
| `name`          | `harper-redirect-ew-subrequests`     | Property name in Akamai.                                              |
| `edgeHostname`  | `harper-redirects.akamaized.net`     | Edge hostname to create via PAPI and attach to the property.          |
| `cnameTarget`   | `harper-redirects.akamaized.net`     | CNAME target your customer hostname will point to.                    |
| `originHostname`| `harper.staging.example.com`         | Origin host (often your Harper or app host).                          |
| `sendHostHeader`| `harper.staging.example.com`         | Host header the property forwards to the origin/Harper.               |

#### `productId` values

`productId` must be a **valid product** on your Akamai contract (e.g. `prd_Fresca`). The exact list is contract-specific; discover options via:

https://techdocs.akamai.com/property-mgr/reference/id-prefixes#common-product-ids

Use the value that matches the web delivery product you use for standard properties.

### `harper_app`

| Key                | Example | Notes                                         |
|--------------------|---------|-----------------------------------------------|
| `uploadRedirectJSON` | `true`  | Whether `redirects/redirects.json` is used. |

---

## Redirects: `redirects/redirects.json`

Example:

```json
{
  "data": [
    {
      "utcStartTime": "",
      "utcEndTime": "",
      "path": "/shop/live-shopping",
      "host": "",
      "version": "0",
      "redirectURL": "/s/events",
      "operations": "",
      "statusCode": "301",
      "regex": 0
    }
  ]
}
```

Each object in `data` represents one redirect rule that Harper can evaluate. Typical usage:

- `path` / `host` – what to match
- `redirectURL` – where to send the client
- `statusCode` – usually `301` or `302`
- `regex` – treat `path` as regex when set accordingly (Harper-specific)

---

## Step-by-Step: Using This Template

### 1. Clone the repo

```sh
git clone https://github.com/<your-org>/harper-akamai-redirect-template.git
cd harper-akamai-redirect-template
```

### 2. Set Akamai secrets and vars (GitHub)

In your GitHub repo settings → **Actions → Secrets and variables**:

**Secrets**
- `AKAMAI_HOST`
- `AKAMAI_CLIENT_TOKEN`
- `AKAMAI_CLIENT_SECRET`
- `AKAMAI_ACCESS_TOKEN`

**Variables (optional)**
- `ACCOUNT_SWITCH_KEY`

### 3. Configure `akamai/bootstrap-config.json`

Update:

- `akamai_account.contractId` / `groupId`
- `akamai_edgeworker.harperRedirectBaseUrl`, `name`, `resourceTierId`
- `akamai_property.productId`, `network`, `name`, `edgeHostname`, `cnameTarget`, `originHostname`, `sendHostHeader`
- `harper_app.uploadRedirectJSON`

### 4. Update `redirects/redirects.json`

Add or edit entries in `data` to define your redirects (paths, hosts, status codes, targets). Keep the format consistent with the example above.

### 5. Run the bootstrap workflow

From GitHub:

1. Go to **Actions → Bootstrap Akamai Redirect Stack**.
2. Click **Run workflow** on the desired branch.
3. Wait for the job to finish; it will register/upload the EdgeWorker and create/update the property and hostnames on STAGING.

### 6. Add 

1. Point a customer hostname to the configured `cnameTarget`/edge hostname.
2. Request a URL that should redirect, for example:

```sh
curl -I https://www.example.com/shop/live-shopping

### 7. Test redirects

1. Point a customer hostname to the configured `cnameTarget`/edge hostname.
2. Request a URL that should redirect, for example:

```sh
curl -I https://www.example.com/shop/live-shopping
```

3. Confirm the status code and `Location` header match your Harper rules.