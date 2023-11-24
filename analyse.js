const results = JSON.parse(
  "[" + require("fs").readFileSync("results", "utf8").slice(0, -2) + "]",
);

const resultsByCat = results.reduce(
  (prev, current) => {
    if (current.label === "fork") {
      prev.fork.push(current);
    } else {
      prev.thread.push(current);
    }
    return prev;
  },
  { fork: [], thread: [] },
);

console.table(
  Object.keys(resultsByCat).map((label, i) => {
    const l = resultsByCat[label].length;
    const res = resultsByCat[label];
    const p = (key, frac) =>
      res.sort((a, b) => a[key] - b[key])[Math.round(l * frac)]?.[key];
    const mean = (key) => res.reduce((prev, curr) => prev + curr[key], 0) / l;
    return Object.fromEntries(
      Object.entries({
        label,
        observed: mean("overall"),
        read: mean("readFileDuration"),
        parse: mean("parseDuration"),
        transform: mean("transformDuration"),
        transformP10: p("transformDuration", 0.1),
        transformP50: p("transformDuration", 0.5),
        transformP90: p("transformDuration", 0.9),
        worker: mean("workerDuration"),
        samples: l,
      }).map(([key, val]) => [
        key,
        typeof val === "number" ? Math.round(val) : val,
      ]),
    );
  }),
);
