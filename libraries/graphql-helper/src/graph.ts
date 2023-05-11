import { apmHelper } from "@eapi/graphql-helper";
apmHelper.startApm("graph");
const apm = require("elastic-apm-node");
apm.addFilter(optionsFilter);
import { dateScalarDefinition, nonEmptyStringScalarDefinition, stringOrNumberScalarDefinition } from "./custom-scalar";
import fs from "fs";
import express from "express";
import { ApolloServer, gql } from "apollo-server-express";
import { applyMiddleware } from "graphql-middleware";
import { buildSubgraphSchema } from "@apollo/subgraph";
const { ApolloGateway, RemoteGraphQLDataSource } = require("@apollo/gateway");
const _ = require("lodash");
import * as currentModule from "./graph";

const servicePort: number = Number(process.env.PORT) || 3000;

let introspectionResponseData: any = null;

export const responseFormatter = (queriesToHide: string[], mutationsToHide: string[], inputsToHide: string[]) => (response: any, request: any) => {
  if (request && request.operationName && request.operationName === "IntrospectionQuery") {
    if (introspectionResponseData) {
      response.data = introspectionResponseData;
    } else {
      if (
        (queriesToHide && queriesToHide.length > 0) ||
        (mutationsToHide && mutationsToHide.length > 0) ||
        (inputsToHide && inputsToHide.length > 0)
      ) {
        if (response && response.data) {
          if (response.data["__schema"]) {
            if (response.data["__schema"].types && response.data["__schema"].types.length > 0) {
              for (let i = 0; i < response.data["__schema"].types.length; i++) {
                // Mutations
                if (mutationsToHide && mutationsToHide.length > 0) {
                  if (response.data["__schema"].types[i].name === "Mutation" && response.data["__schema"].types[i].kind === "OBJECT") {
                    if (response.data["__schema"].types[i].fields && response.data["__schema"].types[i].fields.length > 0) {
                      // with removing object
                      for (let x = 0; x < response.data["__schema"].types[i].fields.length; x++) {
                        if (mutationsToHide.includes(response.data["__schema"].types[i].fields[x].name)) {
                          response.data["__schema"].types[i].fields.splice(x, 1);
                        }
                      }
                    }
                  }
                }

                // Queries
                if (queriesToHide && queriesToHide.length > 0) {
                  if (response.data["__schema"].types[i].name === "Query" && response.data["__schema"].types[i].kind === "OBJECT") {
                    if (response.data["__schema"].types[i].fields && response.data["__schema"].types[i].fields.length > 0) {
                      // removing object
                      for (let x = 0; x < response.data["__schema"].types[i].fields.length; x++) {
                        if (queriesToHide.includes(response.data["__schema"].types[i].fields[x].name)) {
                          response.data["__schema"].types[i].fields.splice(x, 1);
                        }
                      }
                    }
                  }
                }

                // Inputs
                if (inputsToHide && inputsToHide.length > 0) {
                  if (inputsToHide.includes(response.data["__schema"].types[i].name) && response.data["__schema"].types[i].kind === "INPUT_OBJECT") {
                    response.data["__schema"].types.splice(i, 1);
                  }
                }
              }

              introspectionResponseData = response.data;
            }
          }
        }
      }
    }
  }

  return response;
}

export async function startGateway() {
  let gatewayConfig: any = {
    buildService({ url }: any) {
      return new RemoteGraphQLDataSource({
        url,
        willSendRequest({ request, context }: any) {
          request.http.headers.set('company-name', context.companyName);
          request.http.headers.set('roles', context.roles);
          request.http.headers.set('client-id', context.clientId);
        },
      });
    },
  };

  if (process.env.NODE_ENV === "local") {
    gatewayConfig["supergraphSdl"] = fs.readFileSync('./supergraph.graphql').toString();
  }

  const gateway = new ApolloGateway(gatewayConfig);

  const app = express();

  const server = new ApolloServer({
    gateway,
    introspection: process.env.NODE_ENV === "local",
    plugins: getPlugins(true),
    context: async ({ req }) => {
      let rolesValue : string = _.get(req, 'headers.roles');

      return {
        companyName: req.headers["company-name"] ?? null,
        clientId: req.headers["client-id"] ?? null,
        roles: JSON.stringify( rolesValue ? rolesValue.split(',') : [] ),
        webRootUrl: currentModule.getWebrootUrl(),
        rocketAccountId: req.headers["rocket-account-id"] ?? null,
        rocketHomesId: req.headers["rocket-homes-id"] ?? null
      }
    },
    formatResponse: responseFormatter([], [], [])
  });

  await server.start();

  app.get("/api/v1/system/health", function(req, res) {
    res.send("OK");
  });

  server.applyMiddleware({ app });

  return app.listen({ port: servicePort });
}

export async function startGraph(dirname: string, resolvers: any, permissions: any) {
  const customScalars = {
    Date: dateScalarDefinition,
    NonEmptyString: nonEmptyStringScalarDefinition,
    StringOrNumber: stringOrNumberScalarDefinition,
  };

  const fullResolvers: any = {
    ...customScalars,
    ...resolvers
  };

  let typeDefsString;

  if (process.env.NODE_ENV === "local") {
    typeDefsString = fs
      .readFileSync(`${dirname}/../schema.graphql`)
      .toString("utf-8");
  } else {
    typeDefsString = fs
      .readFileSync(`${dirname}/schema.graphql`)
      .toString("utf-8");
  }
  /*
      We need to build up the service differently because
      graphql-sheild has troubles with reference resolvers in federation.
      See https://github.com/maticzav/graphql-middleware/issues/351
   */
  const rawSchema = buildSubgraphSchema([
    {
      typeDefs: gql`
          ${typeDefsString}
      `,
      resolvers: fullResolvers,
    },
  ]);

  const shieldedSchema = applyMiddleware(rawSchema, permissions);

  const server = new ApolloServer({
    schema: shieldedSchema,
    plugins: getPlugins(),
    context: async ({ req }) => ({
      companyName: req.headers["company-name"] ?? null,
      clientId: req.headers["client-id"] ?? null,
      roles: currentModule.getRoles(req),
      webRootUrl: currentModule.getWebrootUrl()
    }),
  });

  await server.start();

  const app = express();
  app.get("/api/v1/system/health", function(req, res) {
    res.send("OK");
  });

  server.applyMiddleware({ app });

  return app.listen({ port: servicePort });
}

export function getPlugins(isGateway?: boolean) {
  if (isGateway) {
    return [
      {
        async requestDidStart(requestContext: any) {
          apm.setCustomContext({
            operationName: requestContext.request.operationName,
            query: requestContext.request.query,
            variables: requestContext.request.variables,
            context: requestContext.context
          });

          return {
            async didEncounterErrors(requestContext: any) {
              requestContext.errors?.forEach((error: any) => {
                apm.captureError(error, {
                  custom: {
                    subgraph: error?.extensions?.serviceName
                  }
                });
              });

              apm.setTransactionOutcome("failure");
            }
          };
        }
      }
    ];
  } else {
    return [
      {
        async requestDidStart(requestContext: any) {
          apm.setCustomContext({
            operationName: requestContext.request.operationName,
            query: requestContext.request.query,
            variables: requestContext.request.variables,
            context: requestContext.context
          });

          const transaction = apm.currentTransaction;

          return {
            async executionDidStart() {
              return {
                willResolveField({ info }: any) {
                  const span = transaction?.startSpan(
                    `RESOLVE ${info.parentType.name}.${info.fieldName}`
                  );

                  return () => {
                    span?.end();
                  };
                }
              };
            },
          };
        }
      }
    ];
  }
}

export function optionsFilter(payload: any) {
  /*
      APM server gets flooded with OPTIONS requests for CORS.
      We will filter these out.
      This cleans up the reporting dashboards significantly.
   */
  if (_.get(payload, "context.request.method") === "OPTIONS") {
    return false;
  }

  return payload;
}

export function getWebrootUrl(): string {
  return "http://localhost";
}

export function getRoles(request: any): Array<string> {
  let rolesValue: string | Array<string> = _.get(request, "headers.roles");
  if (_.isArray(rolesValue)) {
    return rolesValue as Array<string>;
  }

  let outcome: any = _.attempt(JSON.parse, rolesValue);

  if (_.isError(outcome) || !_.isArray(outcome)) {
    return [];
  }

  return outcome;
}

export function isFieldRequested(info: any, field: string) {
  let result = false;

  if (info.fieldNodes && info.fieldNodes.length > 0) {
    info.fieldNodes.forEach((fieldNode: any) => {
      if (!result) {
        const selectionSet = fieldNode.selectionSet;

        if (selectionSet && selectionSet.selections && selectionSet.selections.length > 0) {
          selectionSet.selections.forEach((selection: any) => {
            if (!result) {
              if (selection.name && selection.name.value && selection.name.value === field) {
                result = true;
              }
            } else {
              return;
            }
          })
        }
      } else {
        return;
      }
    })
  }

  return result;
}
