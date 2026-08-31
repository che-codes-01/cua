#!/bin/bash
set -e

RUNNER_SOURCE="/Users/I756895/Desktop/aoc-6/poc/cua/cua/packages/runner"
RUNNER_TEMP="/tmp/cua-runner"

echo "Cloning cua-runner repo..."
rm -rf "$RUNNER_TEMP"
git clone https://github.com/che-codes-01/cua-runner.git "$RUNNER_TEMP"

echo "Syncing runner files..."
cp -r "$RUNNER_SOURCE"/* "$RUNNER_TEMP/"

echo "Pushing to cua-runner..."
cd "$RUNNER_TEMP"
git add .
git commit -m "Update runner with latest changes" || echo "No changes to commit"
git push

echo "✓ Runner pushed to cua-runner repo"
