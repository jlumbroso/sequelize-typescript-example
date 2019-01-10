import { BelongsToMany, Column, Model, Table } from "sequelize-typescript";

import { Stockquote } from "./Stockquote";
import { StockquoteTag } from "./StockquoteTag";

@Table
export class Tag extends Model<Tag> {
  @Column
  public description: string;

  @BelongsToMany(() => Stockquote, () => StockquoteTag)
  public stockquotes: Stockquote[];
}
