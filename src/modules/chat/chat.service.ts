import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from '../../common/interfaces/chat-completion.interface';
import { NvidiaApiService } from './services/nvidia-api.service';
import { ContextManagerService } from './services/context-manager.service';
import { AutoVisionService } from './services/auto-vision.service';
import { ToolParserService } from './services/tool-parser.service';
import { StreamTransformerService } from './services/stream-transformer.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ChatService {
    constructor(
        private nvidiaApi: NvidiaApiService,
        private contextManager: ContextManagerService,
        private autoVision: AutoVisionService,
        private toolParser: ToolParserService,
        private streamTransformer: StreamTransformerService,
        private logger: LoggerService,
    ) { }

    async createCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        // 1. Process images
        const processedMessages = await this.autoVision.processMessages(request.messages);

        // 2. Truncate context
        const truncatedMessages = this.contextManager.truncateMessages(processedMessages);

        // 3. Make API call
        const response = await this.nvidiaApi.createCompletion({
            ...request,
            messages: truncatedMessages,
        });

        const data = response.data;

        // 4. Parse tool calls if present in the content
        if (data.choices && data.choices[0]?.message?.content) {
            const content = data.choices[0].message.content;
            if (this.toolParser.isToolCall(content)) {
                const toolCalls = this.toolParser.parseToolCalls(content);
                if (toolCalls.length > 0) {
                    data.choices[0].message.tool_calls = toolCalls;
                    // Optionally clear content if it only contains the tool call
                    // data.choices[0].message.content = null;
                }
            }
        }

        return data;
    }

    async createStreamingCompletion(request: ChatCompletionRequest): Promise<Observable<ChatCompletionChunk>> {
        // 1. Process images
        const processedMessages = await this.autoVision.processMessages(request.messages);

        // 2. Truncate context
        const truncatedMessages = this.contextManager.truncateMessages(processedMessages);

        // 3. Make API call
        const response = await this.nvidiaApi.createCompletion({
            ...request,
            messages: truncatedMessages,
        });

        // 4. Transform stream
        return this.streamTransformer.transformStream(response.data, request.model);
    }
}
