import moment from "moment";
import { GraphQLScalarType, Kind } from "graphql";

function checkDateValidation(dateValue: any) {
    if (!(typeof dateValue === "string")) {
        throw new TypeError(
            `Date cannot represent non-string type ${JSON.stringify(
                dateValue,
            )}`,
        );
    }

    let parsedDate = moment.utc(dateValue);

    if (!parsedDate.isValid()) {
        throw new TypeError("Invalid date string");
    }
    return parsedDate;
}

export const nonEmptyStringScalarDefinition = new GraphQLScalarType({
    name: "NonEmptyString",
    description: "Non empty string",
    serialize: (value: unknown): string => {
        if (typeof value !== "string" || value.length === 0) {
            throw new TypeError("Input cannot be blank");
        }

        return value;
    },
    parseValue: (value: unknown): string => {
        if (typeof value !== "string" || value.length === 0) {
            throw new TypeError("Input cannot be blank");
        }

        return value;
    },
});

export const dateScalarDefinition = new GraphQLScalarType({
    name: "Date",
    description: "Date custom scalar type",
    // Convert outgoing Date for JSON
    serialize(value) {
        return checkDateValidation(value).toJSON();
    },
    // Convert incoming Date
    parseValue(value) {
        if (typeof value === "string" && value.toLocaleLowerCase() === "now") {
            return moment.utc();
        }

        return checkDateValidation(value);
    },
    // Convert hard-coded AST string to Date
    parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) {
            throw new TypeError(
                `Date cannot represent non string type ${
                    "value" in ast && ast.value
                }`,
            );
        }

        if (ast.value.toLowerCase() === "now") {
            return moment.utc();
        }

        const parsedDate = moment.utc(ast.value);

        if (!parsedDate.isValid()) {
            throw new TypeError("Invalid date string");
        }
        return parsedDate;
    },
});

export const stringOrNumberScalarDefinition = new GraphQLScalarType({
    name: "StringOrNumber",
    description: "A String or a Number",
    serialize: (value: unknown): string | number => {
        if (typeof value !== "string" && typeof value !== "number") {
            throw new TypeError("Value must be either a String or a Number");
        }

        return value;
    },
    parseValue: (value: unknown): string | number => {
        if (typeof value !== "string" && typeof value !== "number") {
            throw new TypeError("Value must be either a String or a Number");
        }

        return value;
    },
});
