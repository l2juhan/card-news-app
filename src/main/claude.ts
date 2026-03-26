import { query } from '@anthropic-ai/claude-agent-sdk';
import type {
  SDKMessage,
  SDKResultSuccess,
  SDKResultError,
} from '@anthropic-ai/claude-agent-sdk';
import path from 'path';
import type { StyleName } from '../shared/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClaudeCallbacks {
  onProgress: (status: string, percent: number) => void;
  onError: (message: string) => void;
}

interface ClaudeResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 프로젝트 루트 (instagram-card-news symlink가 해석되는 기준) */
const PROJECT_ROOT = path.resolve(__dirname, '../..');

const CARD_NEWS_SYSTEM_APPEND = `
당신은 Instagram 카드뉴스 생성 전문 AI입니다.
사용자의 요청에 따라 카드뉴스를 생성하거나 수정합니다.
작업 디렉토리의 .claude/skills/ 에 있는 스킬 파일들을 참고하세요.
- card-news.md: 카드뉴스 생성 파이프라인
- edit-card-news.md: 카드뉴스 수정 파이프라인
- style-{name}.md: 스타일별 가이드
`.trim();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCommonOptions(abortController?: AbortController) {
  return {
    cwd: PROJECT_ROOT,
    systemPrompt: {
      type: 'preset' as const,
      preset: 'claude_code' as const,
      append: CARD_NEWS_SYSTEM_APPEND,
    },
    settingSources: ['project' as const],
    permissionMode: 'bypassPermissions' as const,
    allowDangerouslySkipPermissions: true,
    model: 'claude-sonnet-4-6',
    maxTurns: 30,
    effort: 'medium' as const,
    abortController,
  };
}

/**
 * SDK 스트림에서 메시지를 소비하고, 진행 상태를 콜백으로 전달한다.
 * result 메시지를 받으면 반환한다.
 */
async function consumeStream(
  stream: AsyncGenerator<SDKMessage, void>,
  callbacks: ClaudeCallbacks,
  progressSteps: { label: string; percent: number }[],
): Promise<ClaudeResult> {
  let stepIndex = 0;

  for await (const message of stream) {
    switch (message.type) {
      case 'assistant': {
        // 진행 상태 추정: assistant 메시지마다 단계를 올린다
        if (stepIndex < progressSteps.length) {
          const step = progressSteps[stepIndex];
          callbacks.onProgress(step.label, step.percent);
          stepIndex++;
        }
        break;
      }

      case 'result': {
        const result = message as SDKResultSuccess | SDKResultError;
        if (result.subtype === 'success') {
          callbacks.onProgress('완료', 100);
          return { success: true };
        }
        // 에러
        const errorResult = result as SDKResultError;
        const errorMsg =
          errorResult.errors?.join(', ') || `실패: ${errorResult.subtype}`;
        callbacks.onError(errorMsg);
        return { success: false, error: errorMsg };
      }
    }
  }

  // result 메시지 없이 스트림 종료 — 예기치 않은 상황
  callbacks.onError('작업이 완료 메시지 없이 종료되었습니다.');
  return { success: false, error: 'No result message received' };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 카드뉴스 생성: 주제를 받아 Claude가 slides.json을 생성하고 렌더링한다.
 */
export async function generateCardNews(
  topic: string,
  style: StyleName,
  slideCount: number,
  callbacks: ClaudeCallbacks,
  abortController?: AbortController,
): Promise<ClaudeResult> {
  const prompt = [
    `"${topic}" 주제로 ${style} 스타일 카드뉴스를 ${slideCount}장 생성해줘.`,
    '',
    '카드뉴스 생성 파이프라인(card-news.md 스킬)을 따라 진행해줘.',
    `스타일 가이드는 style-${style}.md를 참고해줘.`,
    '',
    '렌더링까지 완료해줘.',
  ].join('\n');

  const stream = query({
    prompt,
    options: buildCommonOptions(abortController),
  });

  const progressSteps = [
    { label: '리서치 중...', percent: 10 },
    { label: '팩트체크 중...', percent: 25 },
    { label: '카피 작성 중...', percent: 40 },
    { label: '카피 토론 중...', percent: 55 },
    { label: '렌더링 중...', percent: 75 },
    { label: '시각 검토 중...', percent: 90 },
  ];

  return consumeStream(stream, callbacks, progressSteps);
}

/**
 * 카드뉴스 수정: 사용자의 수정 지시를 Claude에게 전달한다.
 */
export async function editCardNews(
  instruction: string,
  callbacks: ClaudeCallbacks,
  abortController?: AbortController,
): Promise<ClaudeResult> {
  const prompt = [
    instruction,
    '',
    '카드뉴스 수정 파이프라인(edit-card-news.md 스킬)을 따라 진행해줘.',
    '수정된 슬라이드만 다시 렌더링해줘.',
  ].join('\n');

  const stream = query({
    prompt,
    options: buildCommonOptions(abortController),
  });

  const progressSteps = [
    { label: '수정 분석 중...', percent: 20 },
    { label: '수정 적용 중...', percent: 50 },
    { label: '렌더링 중...', percent: 75 },
    { label: '검토 중...', percent: 90 },
  ];

  return consumeStream(stream, callbacks, progressSteps);
}

/**
 * 스타일 변경: 전체 슬라이드를 새 스타일로 재렌더링한다.
 */
export async function changeStyle(
  newStyle: StyleName,
  callbacks: ClaudeCallbacks,
  abortController?: AbortController,
): Promise<ClaudeResult> {
  const prompt = [
    `카드뉴스 스타일을 ${newStyle}로 변경해줘.`,
    `style-${newStyle}.md 가이드를 참고해서 전체 슬라이드를 재렌더링해줘.`,
  ].join('\n');

  const stream = query({
    prompt,
    options: buildCommonOptions(abortController),
  });

  const progressSteps = [
    { label: '스타일 변경 중...', percent: 30 },
    { label: '렌더링 중...', percent: 70 },
  ];

  return consumeStream(stream, callbacks, progressSteps);
}
