# Load Tests

Requires [k6](https://k6.io/docs/get-started/installation/).

Run from this directory (`loadtest/`) or from project root with the path:

## Smoke Test (5 VUs, 30s)
```bash
cd loadtest && k6 run smoke.js
# Or from project root:
# k6 run loadtest/smoke.js
```

## Stress Test (ramp to 500 VUs)
```bash
cd loadtest && k6 run stress.js
# Or from project root:
# k6 run loadtest/stress.js
```

## Against production
```bash
cd loadtest && k6 run -e API_URL=https://api.shhh.app smoke.js
```
