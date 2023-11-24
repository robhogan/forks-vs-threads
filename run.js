const { Worker } = require("jest-worker");
const Walker = require("walker");
const fs = require("fs");

async function crawl() {
  const absolutePaths = [];
  const walker = new Walker(__dirname + "/node_modules");
  walker.on("file", (filePath) => {
    if (filePath.endsWith(".js")) {
      absolutePaths.push(filePath);
    }
  });
  return new Promise((resolve) => {
    walker.on("end", resolve(absolutePaths));
  });
}

async function main() {
  const absolutePaths = await crawl();
  const enableWorkerThreads = process.env.WORKER_THREADS === "1";
  let workerDuration = 0;
  let readFileDuration = 0;
  let parseDuration = 0;
  let transformDuration = 0;
  let errors = 0;
  let transformed = 0;
  const label = enableWorkerThreads ? "thread" : "fork";
  const worker = new Worker(require.resolve("./worker.js"), {
    enableWorkerThreads,
    numWorkers: 2,
  });

  await worker.start();
  const overallStart = performance.now();
  const results = await Promise.all(
    absolutePaths.map((absPath) => worker.transform(absPath)),
  );
  const overall = performance.now() - overallStart;

  for (const result of results) {
    if (result.error) {
      errors++;
      continue;
    }
    transformed++;
    workerDuration += result.extra.workerTime;
    readFileDuration += result.extra.readFileTime;
    parseDuration += result.extra.parseTime;
    transformDuration += result.extra.transformTime;
  }

  fs.appendFileSync(
    "results",
    JSON.stringify({
      label,
      overall,
      readFileDuration,
      parseDuration,
      transformDuration,
      workerDuration,
      transformed,
      errors,
    }) + ",\n",
  );
  await worker.end();
}

main();
