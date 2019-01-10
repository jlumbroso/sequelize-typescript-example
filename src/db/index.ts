// Sequelize ORM (Typescript version)
import { Sequelize } from "sequelize-typescript";

// Logger package
import { logger } from "../utils/Logger";

// Our models
import { Stockquote } from "./models/Stockquote";
import { StockquoteTag } from "./models/StockquoteTag";
import { Tag } from "./models/Tag";

// Connect to the database
const sequelize = new Sequelize({
  dialect: "sqlite",
  logging: false,
  storage: ":memory:",

  // INFO: https://github.com/sequelize/sequelize/issues/8417#issuecomment-334056048
  operatorsAliases: false
});

// Register our models with sequelize
sequelize.addModels([Stockquote, StockquoteTag, Tag]);

// Helper methods

// Force Initialization of the models and wipe all data ///
async function resetDb() {
  try {
    await sequelize.sync({ force: true });
    logger.info("DB: Database initialized");
  } catch (ex) {
    logger.error("DB: ERROR initializing database");
    logger.error(ex);
    return false;
  }
  return true;
}

// Module exports
export { sequelize, Sequelize };
export { Stockquote, StockquoteTag, Tag };
export { resetDb };
