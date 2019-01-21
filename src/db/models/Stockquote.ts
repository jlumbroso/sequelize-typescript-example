import { BelongsToMany, Column, Model, Table } from "sequelize-typescript";

import { StockquoteTag } from "./StockquoteTag";
import { Tag } from "./Tag";

@Table
export class Stockquote extends Model<Stockquote> {
  @Column
  public company: string;

  @Column
  public date: Date;

  @Column
  public open: number;

  @Column
  public close: number;

  @Column
  public volume: number;

  @Column
  public changePercent: number;

  @BelongsToMany(() => Tag, () => StockquoteTag)
  public tags?: Tag[];
}
