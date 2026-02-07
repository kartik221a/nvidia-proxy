export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | any[];
    name?: string;
    tool_call_id?: string;
    tool_calls?: ToolCall[];
}

export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    stream?: boolean;
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stop?: string | string[];
    tools?: any[];
    tool_choice?: any;
}

export interface ChatCompletionResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: {
        index: number;
        message: ChatMessage;
        finish_reason: string;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface ChatCompletionChunk {
    id: string;
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    choices: {
        index: number;
        delta: Partial<ChatMessage>;
        finish_reason: string | null;
    }[];
}

import { ToolCall } from './tool-call.interface';
