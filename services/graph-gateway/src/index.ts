import { configurationHelper, graph } from "@eapi/graphql-helper";

export async function startApolloServer() {
    return graph.startGateway();
}

startApolloServer().then((url: any) => {
    console.log(
        `🚀 ${configurationHelper.getServiceName("graph-gateway")} service is ready.`
    );

    console.log(
      `Open Apollo Studio Sandbox at http://sandbox.apollo.dev/?endpoint=http%3A%2F%2Flocalhost%3A8081%2Fgraph-gateway`,
    );
});
