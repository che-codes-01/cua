import { config } from "@/config";

export function buildRunnerCommand(apiKey: string, workspaceId: string): string {
  const serviceUrl = config.nextPublicRunnerConnectorUrl;

  if (!serviceUrl) {
    throw new Error("NEXT_PUBLIC_RUNNER_CONNECTOR_URL not configured");
  }

  return `RUNNER_API_KEY="${apiKey}" \\
RUNNER_SERVICE_URL="${serviceUrl}" \\
RUNNER_NAME="my-machine" \\
npm install -g github:che-codes-01/cua#packages/runner && cua-runner start`;
}

export function buildRunnerDockerCommand(
  apiKey: string,
  workspaceId: string,
  name: string = "cua-runner"
): string {
  const serviceUrl = config.nextPublicRunnerConnectorUrl;

  if (!serviceUrl) {
    throw new Error("NEXT_PUBLIC_RUNNER_CONNECTOR_URL not configured");
  }

  return `docker run -d \\
  -e RUNNER_API_KEY="${apiKey}" \\
  -e RUNNER_SERVICE_URL="${serviceUrl}" \\
  -e RUNNER_NAME="${name}" \\
  -e RUNNER_LABELS="docker" \\
  node:20-alpine npm install -g github:che-codes-01/cua#packages/runner && cua-runner start`;
}

export function buildRunnerDockerComposeConfig(
  apiKey: string,
  workspaceId: string,
  name: string = "cua-runner"
): string {
  const serviceUrl = config.nextPublicRunnerConnectorUrl;

  if (!serviceUrl) {
    throw new Error("NEXT_PUBLIC_RUNNER_CONNECTOR_URL not configured");
  }

  return `version: "3.8"

services:
  ${name}:
    image: node:20-alpine
    environment:
      RUNNER_API_KEY: ${apiKey}
      RUNNER_SERVICE_URL: ${serviceUrl}
      RUNNER_NAME: ${name}
      RUNNER_LABELS: docker
    command: sh -c "npm install -g github:che-codes-01/cua#packages/runner && cua-runner start"
    restart: unless-stopped`;
}
