module.exports = {
    root: true,
    extends: [],
    env: {
        node: true,
        es6: true,
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "script",
    },
    rules: {
        "no-underscore-dangle": [
            "error",
            { allow: ["_source", "_id", "_expandable", "_meta", "_index"] },
        ],
        "no-shadow": ["warn" ],
        "max-len": ["error", { code: 150 }],
        "no-unused-vars": ["warn"],
        "no-var": [ "error" ],
        "no-empty": [ "error" ],
        "complexity" : ["warn", 8]
    },
    settings: {
        "import/resolver": {
            node: {
                extensions: [".js", ".jsx", ".ts", ".tsx"],
            },
        },
    },
    plugins: ["jest"],
    overrides : [
        {
            files: ['*.graphql'],
            parser: '@graphql-eslint/eslint-plugin',
            plugins: ['@graphql-eslint'],
            parserOptions: {
                schema: "./services/**/*.graphql",
                skipGraphQLConfig: true
            },
            rules : {
                "@graphql-eslint/known-type-names" : [ "error" ],
                "@graphql-eslint/no-anonymous-operations" : [ "error" ],
                "@graphql-eslint/no-undefined-variables" : [ "error" ],
                "@graphql-eslint/no-unreachable-types" : [ "error" ],
                "@graphql-eslint/no-unused-variables" : [ "error" ],
                "@graphql-eslint/one-field-subscriptions" : [ "error" ],
                "@graphql-eslint/possible-type-extension" : [ "error" ],
                "@graphql-eslint/provided-required-arguments" : [ "error" ],
                "@graphql-eslint/unique-argument-names" : [ "error" ],
                "@graphql-eslint/avoid-operation-name-prefix" : [ "error" ],
            }
        }
    ]
}
