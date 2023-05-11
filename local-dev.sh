#!/bin/bash
yarn
yarn run tsbuild
rm services/backoffice-subgraph/dist/schema.graphql
cp services/backoffice-subgraph/schema.graphql services/backoffice-subgraph/dist/schema.graphql

set -e
rover supergraph compose --config ./sg-config.yaml > services/graph-gateway/supergraph.graphql --elv2-license=accept
set +e

docker compose up
