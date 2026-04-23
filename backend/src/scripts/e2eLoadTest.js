const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001/api";

const concurrency = Number(process.env.E2E_LOAD_CONCURRENCY || 40);
const requestsPerWorker = Number(process.env.E2E_LOAD_REQUESTS_PER_WORKER || 50);

const runWorker = async () => {
  let ok = 0;
  let fail = 0;
  const latencies = [];

  for (let i = 0; i < requestsPerWorker; i += 1) {
    const started = performance.now();
    try {
      const response = await fetch(`${BASE_URL}/events?status=publie&limit=6`);
      if (response.ok) {
        ok += 1;
      } else {
        fail += 1;
      }
    } catch {
      fail += 1;
    } finally {
      latencies.push(performance.now() - started);
    }
  }

  return { ok, fail, latencies };
};

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
};

const run = async () => {
  const started = performance.now();

  const workers = Array.from({ length: concurrency }, () => runWorker());
  const results = await Promise.all(workers);

  const totalOk = results.reduce((sum, r) => sum + r.ok, 0);
  const totalFail = results.reduce((sum, r) => sum + r.fail, 0);
  const latencies = results.flatMap((r) => r.latencies);
  const durationSec = (performance.now() - started) / 1000;
  const totalRequests = totalOk + totalFail;

  const report = {
    suite: "load-e2e",
    ok: totalFail === 0,
    config: {
      concurrency,
      requestsPerWorker,
      totalRequests,
    },
    metrics: {
      durationSec: Number(durationSec.toFixed(2)),
      throughputRps: Number((totalRequests / durationSec).toFixed(2)),
      successRate: Number(((totalOk / Math.max(1, totalRequests)) * 100).toFixed(2)),
      p50Ms: Number(percentile(latencies, 50).toFixed(2)),
      p95Ms: Number(percentile(latencies, 95).toFixed(2)),
      p99Ms: Number(percentile(latencies, 99).toFixed(2)),
      failures: totalFail,
    },
  };

  console.log(JSON.stringify(report, null, 2));
  if (totalFail > 0) process.exit(1);
};

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        suite: "load-e2e",
        ok: false,
        error: error.message,
      },
      null,
      2
    )
  );
  process.exit(1);
});
