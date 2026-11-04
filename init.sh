#!/usr/bin/env bash
set -euo pipefail

echo "=== Application tests ==="
npm test

echo "=== Production type-check and build ==="
npm run build

echo "Application checks passed. Real upload/OCR/PNG and viewport evidence is recorded under docs/verification/."
