export function getServiceName(defaultServiceName: string) : string {
    return `${
        process.env.SERVICE_NAME || defaultServiceName
    }-${process.env.NODE_ENV}`
}