# NVIDIA Proxy - NestJS Conversion Plan

Convert the existing vanilla Node.js proxy (`D:\nvidia-proxy-for-stepfunflash\nvidia-proxy\server.js`) to a production-grade NestJS application with modular architecture and centralized model configuration.

## Key Benefits of This Architecture

1. **Single Config File for Models** - Add/remove models in one place (`models.config.ts`)
2. **Separation of Concerns** - Each service handles one responsibility
3. **Type Safety** - Full TypeScript with interfaces
4. **Testable** - Easy unit testing with injectable services
5. **OpenClaw Compatible** - Standard OpenAI-compatible endpoints

---

## Project Structure

```
\\wsl.localhost\Ubuntu\home\kartik\nvidia-proxy\
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   ├── config/
│   │   ├── configuration.ts             # Environment config
│   │   └── models.config.ts             # ⭐ MODEL REGISTRY (edit this!)
│   ├── common/
│   │   ├── interfaces/
│   │   │   ├── chat-completion.interface.ts
│   │   │   ├── model.interface.ts
│   │   │   └── tool-call.interface.ts
│   │   └── utils/
│   │       └── token-estimator.ts       # Token counting utility
│   ├── modules/
│   │   ├── chat/
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.controller.ts       # /v1/chat/completions
│   │   │   ├── chat.service.ts          # Main orchestration
│   │   │   ├── services/
│   │   │   │   ├── nvidia-api.service.ts      # NVIDIA API client
│   │   │   │   ├── context-manager.service.ts # Message truncation
│   │   │   │   ├── auto-vision.service.ts     # Image path → base64
│   │   │   │   ├── tool-parser.service.ts     # XML/DSML parsing
│   │   │   │   └── stream-transformer.service.ts # SSE formatting
│   │   │   └── dto/
│   │   │       └── chat-completion.dto.ts
│   │   ├── models/
│   │   │   ├── models.module.ts
│   │   │   ├── models.controller.ts     # /v1/models
│   │   │   └── models.service.ts
│   │   └── logger/
│   │       ├── logger.module.ts
│   │       └── logger.service.ts        # File + console logging
├── .env                                 # Environment variables
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## Proposed Changes

### Configuration Layer

#### [NEW] [configuration.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/config/configuration.ts)
Environment configuration factory:
- `NVIDIA_API_KEY` from env
- `PORT` (default: 3000)
- `NVIDIA_URL` (NVIDIA API endpoint)
- `MAX_CONTEXT_TOKENS` (default: 100000)
- `CHARS_PER_TOKEN` (default: 2)
- `LOG_FILE` path

#### [NEW] [models.config.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/config/models.config.ts)
⭐ **The centralized model registry** - This is where you add new models:
```typescript
export const MODELS: ModelConfig[] = [
  {
    id: 'stepfun-ai/step-3.5-flash',
    name: 'Step 3.5 Flash',
    owner: 'stepfun-ai',
  },
  {
    id: 'deepseek-ai/deepseek-v3.2',
    name: 'DeepSeek v3.2',
    owner: 'deepseek-ai',
  },
  {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi k2.5',
    owner: 'moonshotai',
  },
  // ADD NEW MODELS HERE - just copy the pattern above!
];
```

---

### Common Interfaces

#### [NEW] [model.interface.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/common/interfaces/model.interface.ts)
```typescript
export interface ModelConfig {
  id: string;
  name: string;
  owner: string;
  created?: number;
}
```

#### [NEW] [chat-completion.interface.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/common/interfaces/chat-completion.interface.ts)
OpenAI-compatible request/response types:
- `ChatMessage`, `ChatCompletionRequest`, `ChatCompletionResponse`
- `ChatCompletionChunk` for streaming

#### [NEW] [tool-call.interface.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/common/interfaces/tool-call.interface.ts)
```typescript
export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string; };
}
```

---

### Utility Layer

#### [NEW] [token-estimator.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/common/utils/token-estimator.ts)
Migrated token estimation logic:
- `estimateTokens(text)` - handles strings, arrays, image content
- Conservative 2 chars/token ratio

---

### Logger Module

#### [NEW] [logger.service.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/logger/logger.service.ts)
Custom logger with dual output:
- Console logging with timestamps
- File logging to configurable path
- Implements NestJS `LoggerService`

---

### Models Module

#### [NEW] [models.controller.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/models/models.controller.ts)
Endpoints:
- `GET /v1/models` → Returns list from `models.config.ts`
- `GET /nvidia/v1/models` → Same (alias for compatibility)

#### [NEW] [models.service.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/models/models.service.ts)
Reads from centralized `MODELS` config, formats to OpenAI response format.

---

### Chat Module (Core Logic)

#### [NEW] [chat.controller.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/chat/chat.controller.ts)
Endpoints:
- `POST /v1/chat/completions`
- `POST /nvidia/v1/chat/completions`
Handles both streaming and non-streaming responses.

#### [NEW] [chat.service.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/chat/chat.service.ts)
Main orchestration service that coordinates:
1. Context truncation via `ContextManagerService`
2. Image conversion via `AutoVisionService`
3. API call via `NvidiaApiService`
4. Tool parsing via `ToolParserService`
5. Streaming via `StreamTransformerService`

---

### Chat Sub-Services

#### [NEW] [nvidia-api.service.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/chat/services/nvidia-api.service.ts)
NVIDIA API client:
- HTTP client with axios/HttpModule
- Request payload construction
- Response handling
- Error handling with proper logging

#### [NEW] [context-manager.service.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/chat/services/context-manager.service.ts)
Context management:
- Truncate messages to fit token limit
- Preserve system messages
- Keep recent conversation history

#### [NEW] [auto-vision.service.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/chat/services/auto-vision.service.ts)
Image handling:
- Detect Windows file paths in messages
- Convert images to base64
- Transform to OpenAI multimodal format

#### [NEW] [tool-parser.service.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/chat/services/tool-parser.service.ts)
Tool call parsing:
- XML format: `<tool_call><function=...>...</function></tool_call>`
- DSML format: `<｜DSML｜function_calls>...</｜DSML｜function_calls>`
- Convert to OpenAI tool_calls format

#### [NEW] [stream-transformer.service.ts](file:///wsl.localhost/Ubuntu/home/kartik/nvidia-proxy/src/modules/chat/services/stream-transformer.service.ts)
Streaming response:
- Convert non-stream NVIDIA response to SSE chunks
- Proper chunk formatting with role/content/tool_calls
- `[DONE]` termination

---

## How to Add a New Model

After this refactor, adding a new model is simple:

1. Open `src/config/models.config.ts`
2. Add your model:
```typescript
{
  id: 'your-provider/your-model-id',
  name: 'Human Readable Name',
  owner: 'provider-name',
}
```
3. Restart the server (or it auto-reloads in dev mode)

That's it! No changes needed anywhere else.

---

## Verification Plan

### Automated Testing
```bash
# Run NestJS in dev mode
cd /home/kartik/nvidia-proxy && npm run start:dev

# Test models endpoint
curl http://localhost:3000/v1/models

# Test chat completion (non-streaming)
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "stepfun-ai/step-3.5-flash",
    "messages": [{"role": "user", "content": "Say hello!"}],
    "stream": false
  }'

# Test chat completion (streaming)
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "stepfun-ai/step-3.5-flash",
    "messages": [{"role": "user", "content": "Say hello!"}],
    "stream": true
  }'
```

---

## Environment Variables

Copy the existing `.env`:
```env
NVIDIA_API_KEY=nvapi-xxxxx
PORT=3000
```
