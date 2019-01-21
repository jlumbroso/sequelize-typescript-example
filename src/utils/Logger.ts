// Logger package
import * as pino from "pino";

// Configuration package
import { config } from "node-config-ts";

// Log level
let logLevel = "debug";
if (!config.verbose) logLevel = "info";

export const logger = pino({
  level: logLevel,
  name: "sequelize-typescript-example",
  prettyPrint: { colorize: true }
});
