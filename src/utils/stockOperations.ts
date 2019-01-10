import * as _ from "lodash";
import * as request from "request-promise-native";

import {
  resetDb,
  Sequelize,
  sequelize,
  Stockquote,
  StockquoteTag,
  Tag
} from "../db";
import { logger } from "./Logger";

// This
export async function populateStockData(sign: string) {
  let yearStockData;
  const url = `https://api.iextrading.com/1.0/stock/${sign}/chart/1y`;

  // Retrieve stock data from the web
  try {
    yearStockData = await request.get(url, { json: true });
    logger.info(`WEB: Fetched ${yearStockData.length} quotes for ${sign}...`);
  } catch (exc) {
    logger.error(`WEB: ERROR fetching stock data for ${sign}`);
    logger.error(`WEB: ERROR fetching ${url}`);
    logger.error(exc);
    return false;
  }

  // Add stock data to the database
  try {
    await Promise.all(
      yearStockData.map(async quote => {
        new Stockquote({
          changePercent: quote.changePercent,
          close: quote.close,
          company: sign,
          date: new Date(quote.date),
          open: quote.open,
          volume: quote.volume
        }).save();
      })
    );
    logger.info(`DB: Added stock data for ${sign}`);
    return true;
  } catch (exc) {
    logger.error(`DB: ERROR while adding stock data for ${sign}`);
    logger.error(exc);
  }
  return false;
}

export async function computeStockCorrelation(
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
  const queryA = fetchQuotes(stockA);
  const queryB = fetchQuotes(stockB);

  // Await actually having the results since we will need them for
  // post-processing in the remainder of this function
  let stockAquotes = await _.map(await queryA, obj => obj.dataValues);
  let stockBquotes = await _.map(await queryB, obj => obj.dataValues);

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
