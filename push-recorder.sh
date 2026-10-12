#!/bin/bash
set -e

RECORDER_SOURCE="/Users/I756895/Desktop/aoc-6/poc/cua/cua/packages/recorder"
RECORDER_TEMP="/tmp/cua-recorder"

echo "Cloning cua-recorder repo..."
rm -rf "$RECORDER_TEMP"
git clone https://github.com/che-codes-01/cua-recorder.git "$RECORDER_TEMP"

echo "Syncing recorder files..."
cp -r "$RECORDER_SOURCE"/* "$RECORDER_TEMP/"

# dist/ must be committed so npx github:... works without a build step
# Remove any .gitignore that would exclude dist
if [ -f "$RECORDER_TEMP/.gitignore" ]; then
  # Strip lines that would ignore dist
  grep -v "^dist" "$RECORDER_TEMP/.gitignore" > "$RECORDER_TEMP/.gitignore.tmp" || true
  mv "$RECORDER_TEMP/.gitignore.tmp" "$RECORDER_TEMP/.gitignore"
fi

echo "Pushing to cua-recorder..."
cd "$RECORDER_TEMP"
git add .
git commit -m "Update recorder with latest changes" || echo "No changes to commit"
git push

echo "✓ Recorder pushed to cua-recorder repo"
echo ""
echo "Run it with:"
echo "  npx --yes github:che-codes-01/cua-recorder"
echo "  npx --yes github:che-codes-01/cua-recorder --out workflow.json --name \"My Recording\""
