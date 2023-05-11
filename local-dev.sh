#!/bin/bash
yarn
yarn run tsbuild
rm services/backoffice-subgraph/dist/schema.graphql
cp services/backoffice-subgraph/schema.graphql services/backoffice-subgraph/dist/schema.graphql

docker compose up
