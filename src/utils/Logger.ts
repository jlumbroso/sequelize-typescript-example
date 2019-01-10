import * as pino from "pino";

export const logger = pino({
  level: "debug",
  name: "sequelize-typescript-example",
  prettyPrint: { colorize: true }
});
