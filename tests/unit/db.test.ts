import {
  resetDb,
  Sequelize,
  sequelize,
  Stockquote,
  StockquoteTag,
  Tag
} from "../../src/db";
import { logger } from "../../src/utils/Logger";
import { IsInt } from "sequelize-typescript";

const childLogger = logger.child({ test: "db.test.ts" });

const nameA = "aaaa";
const nameB = "bbbb";

let output: boolean;

describe("database", () => {
  beforeEach(async () => {
    childLogger.debug("TEST: Before");
    childLogger.debug("TEST: Resetting DB");
    output = await resetDb();
  });
  afterEach(async () => {
    childLogger.debug("TEST: After");
    childLogger.debug("TEST: Resetting DB");
    await resetDb();
  });

  describe("init", () => {
    it("should be able to reset", async () => {
      expect(output).toBeTruthy();
    });

    it("should be able to add a new stock", async () => {
      await new Stockquote({
        changePercent: 0,
        close: 0,
        company: "",
        date: new Date(),
        open: 0,
        volume: 0
      }).save();
    });

    it("should be able to store a new stock", async () => {
      await new Stockquote({
        changePercent: 0,
        close: 0,
        company: "",
        date: new Date(),
        open: 0,
        volume: 0
      }).save();
      const result = await Stockquote.findAll();
      expect(result).toHaveLength(1);
    });

    it("should be able to make queries on the stock", async () => {
      await new Stockquote({
        changePercent: 0,
        close: 0,
        company: "aaaa",
        date: new Date(),
        open: 0,
        volume: 0
      }).save();
      await new Stockquote({
        changePercent: 0,
        close: 0,
        company: "bbbb",
        date: new Date(),
        open: 0,
        volume: 0
      }).save();
      const result = await Stockquote.findAll({
        where: {
          company: { [Sequelize.Op.is]: "aaaa" }
        }
      });
      expect(result).toHaveLength(1);
    });
  });
});
