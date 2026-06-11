/**
 * Back-compat shim: the streaming answer reducer moved to the shared
 * streaming runtime in ARCH-1 phase 1. Import from `@/lib/streaming` in new
 * code; this re-export keeps existing call surfaces unchanged until each one
 * migrates (see docs/streaming-runtime-design.md).
 */
export {
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  finalizeStreamingAnswerState,
  type StreamingAnswerChunkResult,
  type StreamingAnswerState,
} from '@/lib/streaming/answer-reducer'
