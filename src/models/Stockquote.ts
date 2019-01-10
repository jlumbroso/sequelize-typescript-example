import { Column, Model, Table } from "sequelize-typescript";

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
}
