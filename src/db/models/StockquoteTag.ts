import { Column, ForeignKey, Model, Table } from "sequelize-typescript";

import { Stockquote } from "./Stockquote";
import { Tag } from "./Tag";

@Table
export class StockquoteTag extends Model<StockquoteTag> {
  @ForeignKey(() => Stockquote)
  @Column
  public stockquoteId: number;

  @ForeignKey(() => Tag)
  @Column
  public tagId: number;
}
