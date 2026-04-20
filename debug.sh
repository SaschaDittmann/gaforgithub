#!/bin/bash
node_version=$(node -v)
if [[ $node_version != *"v14"* ]]; then
  export PATH="/usr/local/opt/node@14/bin:$PATH"
fi

pushd './functions/'
npm install
npm run build --if-present
npm run test --if-present
popd

pushd './functions/'
func start
popd
