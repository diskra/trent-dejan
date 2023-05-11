import { configurationHelper, graph } from "@eapi/graphql-helper";
const defaultServiceName = "backoffice-subgraph";
import { permissions } from "./permissions";
import resolversRoot from "./resolvers/root";

export async function startApolloServer() {
    const resolvers: any = resolversRoot;

    await graph.startGraph(__dirname, resolvers, permissions);
}

startApolloServer().then(() => {
    console.log(
      `🚀 ${configurationHelper.getServiceName(
        defaultServiceName,
      )} service is ready.`,
    );
    console.log(
      `Open Apollo Studio Sandbox at http://sandbox.apollo.dev/?endpoint=http%3A%2F%2Flocalhost%3A8081%2Fbackoffice-graphql`,
    );
});
