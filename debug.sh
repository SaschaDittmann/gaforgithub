#!/bin/bash
set -e

# Ensure Node.js 22 is available
node_version=$(node -v)
if [[ $node_version != *"v22"* ]]; then
  echo "Warning: Node.js 22 is required. Current version: $node_version"
  if [ -d "/usr/local/opt/node@22/bin" ]; then
    export PATH="/usr/local/opt/node@22/bin:$PATH"
  else
    echo "Error: Node.js 22 not found. Please install it first."
    exit 1
  fi
fi

# Ensure Azure Functions Core Tools v4 is available
if ! command -v func &> /dev/null; then
  echo "Error: Azure Functions Core Tools not found. Install with: npm i -g azure-functions-core-tools@4"
  exit 1
fi

pushd './functions/'
npm install
npm test
popd

pushd './functions/'
func start
popd
