import { getServiceName } from "./configurationHelper";

export function startApm(defaultServiceName: string) {
    if (process.env.APM_HOSTNAME && process.env.APM_SECRET_TOKEN) {
        const apmHostName = process.env.APM_HOSTNAME;
        const apmSecretToken = process.env.APM_SECRET_TOKEN;

        const sampleRate = parseFloat(process.env.APM_SAMPLE_RATE as string)
        require("elastic-apm-node").start({
            serviceName : getServiceName(defaultServiceName),
            serverUrl: apmHostName,
            environment: process.env.APM_ENV,

            // percentage of calls to send metrics for. Set to 1 to track 100% of the calls.
            transactionSampleRate: (sampleRate >= 0 && sampleRate <= 1) ? sampleRate : 1,
            secretToken: apmSecretToken,
            verifyServerCert: process.env.NODE_ENV !== "local",
            cloudProvider: process.env.NODE_ENV === "local" ? "none" : "auto",
        });
    }
}
