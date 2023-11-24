#!/bin/sh

while true; do node run.js && WORKER_THREADS=1 node run.js; done;