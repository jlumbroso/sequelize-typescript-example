import * as _ from "lodash";
import { Sequelize } from "sequelize-typescript";
import { StockQuote } from "./models/stockquote";
import { createSecureContext } from "tls";
import * as moment from "moment";

import * as request from "request-promise-native";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: ":memory:"
  //logging: false
});
//https://api.iextrading.com/1.0/stock/aapl/chart/1y

sequelize.addModels([StockQuote]);

// Force Initialization of the models and wipe all data ///
async function initializeDatabase() {
  try {
    await sequelize.sync({ force: true });
    console.log("DB: Database initialized");
  } catch {
    console.log("DB: ERROR initializing database");
    return false;
  }
  return true;
}

async function populateDb(sign: string) {
  try {
    const yearStockData = await request.get(
      `https://api.iextrading.com/1.0/stock/${sign}/chart/1y`,
      { json: true }
    );
    console.log(`WEB: Fetched ${yearStockData.length} quotes ${sign}...`);
    await Promise.all(
      _.map(yearStockData, quote =>
        new StockQuote({
          company: sign,
          date: new Date(quote.date),
          open: quote.open,
          close: quote.close,
          volume: quote.volume
        }).save()
      )
    );
  } catch {}
}

async function test() {
  if (await initializeDatabase()) {
    console.log("DB: Testing insertion...");
    try {
      await populateDb("amzn");
      console.log("DB: Insertion over");
    } catch {
      console.log("DB: ERROR while inserting");
    }
    //await new Currency({ country: "USD", exchangerate: 1.18 }).save();
    //console.log("Results: ", await Currency.findAll());
    console.log(
      "Results: ",
      await _.map(
        await StockQuote.findAll({
          where: {
            date: {
              [Sequelize.Op.gte]: moment("20180901", "YYYYMMDD").toDate(),
              [Sequelize.Op.lte]: moment("20181001", "YYYYMMDD").toDate()
            }
          }
        }),
        obj => obj.dataValues
      )
    );
  } else console.log("DB: Something failed");
}

test();

/*import { Table, Column, Model, HasMany } from "sequelize-typescript";

@Table
class Person extends Model<Person> {
  @Column
  name: string;
}

const p = new Person({ name: "Alice" });
p.save();
*/
//console.log(Person.findAll());
