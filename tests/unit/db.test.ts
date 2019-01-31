import {
  resetDb,
  Sequelize,
  sequelize,
  Stockquote,
  StockquoteTag,
  Tag
} from "../../src/db";
import { logger } from "../../src/utils/Logger";

const childLogger = logger.child({ test: "db.test.ts" });

const nameA = "aaaa";
const nameB = "bbbb";

let output: boolean;

//
const makeTestStock = (name: string) => {
  return new Stockquote({
    changePercent: 0,
    close: 0,
    company: name,
    date: new Date(),
    open: 0,
    volume: 0
  });
};

const makeTestTag = (name: string) => {
  return new Tag({
    description: name
  });
};

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

  // MISCELLANEOUS DB TESTS
  describe("initialization", () => {
    it("should be able to reset", async () => {
      expect(output).toBeTruthy();
    });
  });

  // STOCKQUOTE TESTS
  describe("Stockquote", () => {
    it("should be able to add a new stock", async () => {
      await makeTestStock("").save();
    });

    it("should be able to store a new stock", async () => {
      await makeTestStock("").save();
      const result = await Stockquote.findAll();
      expect(result).toHaveLength(1);
    });

    it("should be able to make queries on the stock", async () => {
      await makeTestStock(nameA).save();
      await makeTestStock(nameB).save();
      await makeTestStock(nameB).save();

      const resultA = await Stockquote.findAll({
        where: {
          company: { [Sequelize.Op.is]: nameA }
        }
      });
      expect(resultA).toHaveLength(1);

      const resultB = await Stockquote.findAll({
        where: {
          company: { [Sequelize.Op.is]: nameB }
        }
      });
      expect(resultB).toHaveLength(2);
    });
  });

  // TAG TESTS
  describe("Tag", () => {
    it("should be able to add a new tag", async () => {
      await makeTestTag("").save();
    });

    it("should be able to store a new tag", async () => {
      await makeTestTag("").save();
      const result = await Tag.findAll();
      expect(result).toHaveLength(1);
    });

    it("should be able to make queries on the tag", async () => {
      await makeTestTag(nameA).save();
      await makeTestTag(nameB).save();
      await makeTestTag(nameB).save();

      const resultA = await Tag.findAll({
        where: {
          description: { [Sequelize.Op.is]: nameA }
        }
      });
      expect(resultA).toHaveLength(1);

      const resultB = await Tag.findAll({
        where: {
          description: { [Sequelize.Op.is]: nameB }
        }
      });
      expect(resultB).toHaveLength(2);
    });
  });

  // TAG TESTS
  describe("StockquoteTag", () => {
    it("should be able to add Tag to Stockquote", async () => {
      const stockquote = makeTestStock(nameA);
      const tag = makeTestTag(nameB);

      // Create objects in database
      await stockquote.save();
      await tag.save();

      // Create association
      await stockquote.$add("tag", tag);

      // Check that the association was successful
      const query = await Stockquote.findOne();
      expect(query.company).toBe(nameA);

      const queryTag = await query.$get("tags");
      expect(queryTag[0].description).toBe(nameB);
    });

    it("should be able to remove Tag to Stockquote", async () => {
      // Initialize objects and association
      const stockquote = makeTestStock(nameA);
      const tag = makeTestTag(nameB);
      await stockquote.save();
      await tag.save();
      await stockquote.$add("tag", tag);

      // Check that the association was successful
      let queryTag = await stockquote.$get("tags");
      expect(queryTag).toHaveLength(1);

      // Remove association
      await stockquote.$remove("tag", tag);
      queryTag = await stockquote.$get("tags");
      expect(queryTag).toHaveLength(0);
    });
  });
});
