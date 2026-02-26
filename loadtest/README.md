# Load Tests

Requires [k6](https://k6.io/docs/get-started/installation/).

## Smoke Test (5 VUs, 30s)
```bash
k6 run smoke.js
```

## Stress Test (ramp to 500 VUs)
```bash
k6 run stress.js
```

## Against production
```bash
k6 run -e API_URL=https://api.shhh.app smoke.js
```
