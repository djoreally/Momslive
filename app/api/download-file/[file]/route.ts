import { NextResponse } from 'next/server';
import { getRecordingStream } from '../../../../src/server/recordings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const output = await getRecordingStream(file);
  if (!output) return new NextResponse('File not found or expired.', { status: 404 });

  const requestedName = new URL(request.url).searchParams.get('name');
  const safeName = requestedName?.replace(/[\r\n"\\]/g, '') || file;

  return new Response(output.stream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(output.size),
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
