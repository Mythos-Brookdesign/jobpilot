import { handleAiRequest } from '@/server/handle-ai-request';

export function POST(request: Request) {
  return handleAiRequest('stellenanzeige', request);
}
