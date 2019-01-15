import * as _ from "lodash";
import * as moment from "moment";
import * as request from "request-promise-native";

import {
  resetDb,
  Sequelize,
  sequelize,
  Stockquote,
  StockquoteTag,
  Tag
} from "./db";
import { logger } from "./utils/Logger";

// https://api.iextrading.com/1.0/stock/aapl/chart/1y

import {
  computeStockCorrelation,
  populateStockData
} from "./utils/stockOperations";

async function initializeDb() {
  const stock = ["aapl", "amzn", "spy", "snap", "nflx"];
  if (await resetDb()) {
    try {
      const tbl = await Promise.all(stock.map(populateStockData));
      logger.info("DB: Insertion of initial stock data completed");
      logger.info(`tbl: ${tbl.toString()}`);
      return true;
    } catch (exc) {
      logger.error("DB: ERROR while initializing stock database");
    }
  }
  return false;
}

async function test() {
  await initializeDb();

  const fetchQuotes = (name: string) => {
    return Stockquote.findAll({
      order: [["date", "ASC"]],
      where: {
        company: { [Sequelize.Op.is]: name },
        date: {
          [Sequelize.Op.gte]: moment("20180901", "YYYYMMDD").toDate(),
          [Sequelize.Op.lte]: moment("20180905", "YYYYMMDD").toDate()
        }
      }
    });
  };

  const result = await fetchQuotes("aapl");
  const stockAquotes = result.map(obj => obj.dataValues);
  logger.info(stockAquotes);
  /* await computeStockCorrelation(
    "aapl",
    "amzn",
    moment("20180901", "YYYYMMDD").toDate(),
    moment("20181001", "YYYYMMDD").toDate()
  );
  await computeStockCorrelation(
    "spy",
    "aapl",
    moment("20180901", "YYYYMMDD").toDate(),
    moment("20181001", "YYYYMMDD").toDate()
  );
  await computeStockCorrelation(
    "spy",
    "amzn",
    moment("20180901", "YYYYMMDD").toDate(),
    moment("20181001", "YYYYMMDD").toDate()
  ); */
}

test();
