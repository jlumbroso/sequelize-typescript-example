import * as _ from "lodash";
import * as moment from "moment";
import * as request from "request-promise-native";
import { Sequelize } from "sequelize-typescript";

import { Stockquote } from "./models/Stockquote";
import { StockquoteTag } from "./models/StockquoteTag";
import { Tag } from "./models/Tag";

import { logger } from "./utils/Logger";

const sequelize = new Sequelize({
  dialect: "sqlite",
  logging: false,
  storage: ":memory:",

  // INFO: https://github.com/sequelize/sequelize/issues/8417#issuecomment-334056048
  operatorsAliases: false
});
// https://api.iextrading.com/1.0/stock/aapl/chart/1y

sequelize.addModels([Stockquote, StockquoteTag, Tag]);

// Force Initialization of the models and wipe all data ///
async function initializeDatabase() {
  try {
    await sequelize.sync({ force: true });
    logger.info("DB: Database initialized");
  } catch {
    logger.info("DB: ERROR initializing database");
    return false;
  }
  return true;
}

async function correlation(
  stockA: string,
  stockB: string,
  from: Date,
  to: Date
) {
  const fetchQuotes = (name: string) => {
    return Stockquote.findAll({
      order: [["date", "ASC"]],
      where: {
        company: { [Sequelize.Op.is]: name },
        date: {
          [Sequelize.Op.gte]: from,
          [Sequelize.Op.lte]: to
        }
      }
    });
  };

  // Fetch the datasets asynchronously
  const reqA = fetchQuotes(stockA);
  const reqB = fetchQuotes(stockB);

  // Await actually having the results since we will need them for
  // post-processing in the remainder of this function
  let stockAquotes = await _.map(await reqA, obj => obj.dataValues);
  let stockBquotes = await _.map(await reqB, obj => obj.dataValues);

  // Truncate the datasets so they have the same size
  const startDate: Date =
    stockAquotes[0].date > stockBquotes[0].date
      ? (stockAquotes[0].date as Date)
      : (stockBquotes[0].date as Date);

  const endDate: Date =
    stockAquotes.slice(-1)[0].date > stockBquotes.slice(-1)[0].date
      ? (stockAquotes.slice(-1)[0].date as Date)
      : (stockAquotes.slice(-1)[0].date as Date);

  stockAquotes = _.filter(
    stockAquotes,
    sq => sq.date >= startDate && sq.date <= endDate
  );
  stockBquotes = _.filter(
    stockBquotes,
    sq => sq.date >= startDate && sq.date <= endDate
  );

  // Compute correlation of X and Y
  const X = _.map(stockAquotes, sq => sq.changePercent as number);
  const Y = _.map(stockBquotes, sq => sq.changePercent as number);
  const XY = _.map(_.zip(X, Y), pair => pair[0] * pair[1]);

  const n = X.length;
  const sumX = X.reduce((rest, v) => rest + v, 0);
  const sumY = Y.reduce((rest, v) => rest + v, 0);
  const sumXY = XY.reduce((rest, v) => rest + v, 0);
  const sumsqX = X.reduce((rest, v) => rest + v * v, 0);
  const sumsqY = Y.reduce((rest, v) => rest + v * v, 0);

  const correlationXY =
    (n * sumXY - sumX * sumY) /
    Math.sqrt(
      (n * sumsqX - Math.pow(sumX, 2)) * (n * sumsqY - Math.pow(sumY, 2))
    );

  logger.info(
    `Correlation of ${stockA.toUpperCase()} and ${stockB.toUpperCase()} ` +
      `between ${from.toDateString()} and ${to.toDateString()}: ${correlationXY}`
  );

  return correlationXY;
}

async function populateDb(sign: string) {
  try {
    const yearStockData = await request.get(
      `https://api.iextrading.com/1.0/stock/${sign}/chart/1y`,
      { json: true }
    );
    logger.info(`WEB: Fetched ${yearStockData.length} quotes for ${sign}...`);
    await Promise.all(
      _.map(yearStockData, quote =>
        new Stockquote({
          changePercent: quote.changePercent,
          close: quote.close,
          company: sign,
          date: new Date(quote.date),
          open: quote.open,
          volume: quote.volume
        }).save()
      )
    );
  } catch (e) {
    logger.info("DB: ERROR ", e);
  }
}

async function test() {
  if (await initializeDatabase()) {
    logger.info("DB: Testing insertion...");
    try {
      await populateDb("amzn");
      await populateDb("aapl");
      logger.info("DB: Insertion over");
    } catch {
      logger.info("DB: ERROR while inserting");
    }
    // await new Currency({ country: "USD", exchangerate: 1.18 }).save();
    // logger.info("Results: ", await Currency.findAll());
    logger.info(
      "Results: ",
      await _.map(
        await Stockquote.findAll({
          where: {
            date: {
              [Sequelize.Op.gte]: moment("20180901", "YYYYMMDD").toDate(),
              [Sequelize.Op.lte]: moment("20180902", "YYYYMMDD").toDate()
            }
          }
        }),
        obj => obj.dataValues
      )
    );
    await correlation(
      "aapl",
      "amzn",
      moment("20180901", "YYYYMMDD").toDate(),
      moment("20181001", "YYYYMMDD").toDate()
    );
  } else logger.info("DB: Something failed");
}

test();
