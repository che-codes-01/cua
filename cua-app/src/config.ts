export const config = {
  nextPublicRunnerConnectorUrl:
    process.env.NEXT_PUBLIC_RUNNER_CONNECTOR_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : ""),
};
