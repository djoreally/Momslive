import { NextResponse } from 'next/server';
import { cleanupExpiredRecordings, convertWebmToMp4, getRecordingStream } from '../../../src/server/recordings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    await cleanupExpiredRecordings();
    const input = Buffer.from(await request.arrayBuffer());
    const result = await convertWebmToMp4(input);
    const mode = new URL(request.url).searchParams.get('mode');

    if (mode === 'json') {
      return NextResponse.json({
        success: true,
        id: result.id,
        filename: result.filename,
        downloadUrl: `/api/download-file/${result.id}.mp4?name=${encodeURIComponent(result.filename)}`,
      });
    }

    const output = await getRecordingStream(`${result.id}.mp4`);
    if (!output) return NextResponse.json({ error: 'Converted file is unavailable' }, { status: 404 });

    return new Response(output.stream as unknown as BodyInit, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(output.size),
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error('Recording conversion failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal conversion error' },
      { status: 500 },
    );
  }
}
