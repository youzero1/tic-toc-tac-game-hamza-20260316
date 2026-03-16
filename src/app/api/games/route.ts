import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import { getDataSource } from '@/lib/database';
import { GameRecord } from '@/lib/entities/GameRecord';

export async function GET() {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(GameRecord);
    const records = await repo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('GET /api/games error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch game history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { winner, board } = body;

    if (!winner || !board) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const ds = await getDataSource();
    const repo = ds.getRepository(GameRecord);

    const record = repo.create({
      winner,
      board: JSON.stringify(board),
    });

    await repo.save(record);
    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('POST /api/games error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save game result' }, { status: 500 });
  }
}
