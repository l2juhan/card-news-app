// ESLint 9 flat config — card-news-app
//
// 자동 교정 루프(.claude/settings.json PostToolUse Hook)가 매 저장 시
// `eslint --fix`를 실행한다. rules 메시지는 "왜 안 되는가"가 아니라
// "어떻게 고쳐야 하는가"(remediation instruction)를 포함하여
// 에이전트가 자동으로 올바르게 교정할 수 있도록 한다.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // 무시 패턴
  {
    ignores: [
      'dist/**',
      'release/**',
      'build/**',
      'node_modules/**',
      'output/**',
      'workspace/**',
      'templates/**', // symlink 외부 레포
      'scripts/**', // symlink 외부 레포
      '.history/**',
      '*.config.js', // legacy
      'electron-builder.yml',
    ],
  },

  // 기본 JS 규칙
  js.configs.recommended,

  // TypeScript (전체)
  ...tseslint.configs.recommended,

  // 공통 규칙 — 모든 .ts/.tsx 파일
  {
    files: ['src/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // ─── 교정 지시 포함 규칙 (자주 잘못 고치는 항목 우선 적용) ───

      '@typescript-eslint/no-explicit-any': [
        'error',
        {
          // remediation: any 대신
          //   - IPC 페이로드면 src/shared/types.ts 참조 후 정의된 타입 import
          //   - 외부 응답이면 unknown + 타입 가드 (예: if (typeof x === 'object' && x && 'field' in x))
          //   - props면 interface로 명시적 정의
          // `as unknown as X` 캐스팅은 금지 (타입 가드 함수를 작성)
          fixToUnknown: false,
          ignoreRestArgs: false,
        },
      ],

      // remediation: console.* 대신
      //   - IPC 핸들러에서 에러: throw 또는 webContents.send('card-news:error', {message, code})
      //   - Renderer에서: useCardNewsStore.getState().addMessage({type:'error',...})
      //   - 디버깅 임시 출력: 커밋하지 말 것
      // logger 추상화 도입 후 logger.debug/info/error 사용 (현재 미도입)
      'no-console': 'error',

      // ─── 일반 안전성 규칙 ───

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // remediation: `as unknown as X` 대신 타입 가드 함수 사용
      //   function isUser(x: unknown): x is User { return ... }
      //   if (isUser(data)) { /* 타입 좁혀짐 */ }
      // 공통 selector는 모든 src/** 파일에 적용. Main/Preload는 추가 selector를 병합한다.
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
          message:
            'as unknown as X 캐스팅 금지. 타입 가드 함수를 작성하세요. 예: function isUser(x: unknown): x is User { ... }',
        },
      ],

      // 빈 catch 금지(silent failure 방지)
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },

  // ─── Renderer 전용 규칙 (브라우저 컨텍스트, Node API 금지) ───
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+
      'react/prop-types': 'off', // TypeScript 사용
      'react/jsx-uses-react': 'off',

      // remediation: Renderer는 Node API 직접 사용 금지.
      //   - 파일/IPC 작업이 필요하면 src/shared/types.ts에 IPC 채널 추가 →
      //     src/main/ipc.ts에 핸들러 → src/preload/index.ts 노출 → window.api.* 호출
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'fs', message: 'Renderer는 fs 직접 사용 금지. window.api 경유.' },
            { name: 'node:fs', message: 'Renderer는 fs 직접 사용 금지. window.api 경유.' },
            { name: 'fs/promises', message: 'Renderer는 fs 직접 사용 금지. window.api 경유.' },
            { name: 'node:fs/promises', message: 'Renderer는 fs 직접 사용 금지. window.api 경유.' },
            { name: 'path', message: 'Renderer는 path 직접 사용 금지. window.api 경유.' },
            { name: 'node:path', message: 'Renderer는 path 직접 사용 금지. window.api 경유.' },
            { name: 'child_process', message: 'Renderer는 child_process 금지.' },
            { name: 'node:child_process', message: 'Renderer는 child_process 금지.' },
            { name: 'electron', message: 'Renderer는 electron 직접 import 금지. window.api 사용.' },
            { name: 'puppeteer', message: 'Renderer는 puppeteer 금지. main에서만.' },
            {
              name: '@anthropic-ai/claude-agent-sdk',
              message: 'Claude SDK는 main 프로세스에서만. Renderer는 IPC로 결과 수신.',
            },
          ],
          patterns: [
            {
              group: ['fs/*', 'path/*', 'node:fs/*', 'node:path/*'],
              message: 'Node 내장 모듈은 Renderer에서 사용 금지.',
            },
          ],
        },
      ],

      // remediation: 새 IPC 이벤트 리스너는 src/renderer/hooks/useIpc.ts에 통합.
      //   컴포넌트 내부에서 window.api.on*을 직접 등록하면 unmount 시 cleanup 누락 위험.
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'electron',
          message: 'window.electron 직접 사용 금지. preload가 노출한 window.api만 사용.',
        },
      ],
    },
  },

  // ─── Main / Preload 전용 규칙 (Node 컨텍스트) ───
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // ESLint flat config는 동일 규칙 키를 후속 블록이 "전체 교체"한다.
      // 공통 selector(`as unknown as X` 차단)도 여기서 함께 다시 명시해야 유지된다.
      // remediation:
      //   - JSX/React: card-news-renderer-ui 에이전트에 위임 (Main/Preload는 UI 금지)
      //   - `as unknown as X`: 타입 가드 함수 사용 (예: function isUser(x): x is User)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXElement',
          message:
            'Main/Preload에서 JSX 금지. UI는 src/renderer/에서. card-news-renderer-ui 에이전트에 위임.',
        },
        {
          selector: "TSAsExpression > TSAsExpression[typeAnnotation.type='TSUnknownKeyword']",
          message:
            'as unknown as X 캐스팅 금지. 타입 가드 함수를 작성하세요. 예: function isUser(x: unknown): x is User { ... }',
        },
      ],
    },
  },

  // ─── shared 타입 ───
  {
    files: ['src/shared/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },

  // ─── Prettier (마지막 — 충돌하는 stylistic 규칙 비활성화) ───
  prettier,
];
