import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class GameRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  winner!: string;

  @Column({ type: 'varchar' })
  board!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
