import { Table, Column, Model } from "sequelize-typescript";

@Table
export class StockQuote extends Model<StockQuote> {
  @Column
  company: string;

  @Column
  date: Date;

  @Column
  open: number;

  @Column
  close: number;

  @Column
  volume: number;
}
