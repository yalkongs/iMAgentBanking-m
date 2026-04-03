import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      OPENAI_API_KEY: 'test-openai-key-placeholder',
      ANTHROPIC_API_KEY: 'test-anthropic-key-placeholder',
    },
  },
})
