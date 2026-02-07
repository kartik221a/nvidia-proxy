import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatCompletionRequest } from '../../common/interfaces/chat-completion.interface';
import { LoggerService } from '../logger/logger.service';

@Controller()
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly logger: LoggerService,
    ) { }

    @Post(['v1/chat/completions', 'nvidia/v1/chat/completions'])
    async createChatCompletion(
        @Body() body: ChatCompletionRequest,
        @Res() res: Response,
    ) {
        this.logger.log(`Received chat completion request for model: ${body.model}`, 'ChatController');

        try {
            if (body.stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                const stream = await this.chatService.createStreamingCompletion(body);

                stream.subscribe({
                    next: (chunk) => {
                        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                    },
                    error: (err) => {
                        this.logger.error(`Streaming error: ${err.message}`, err.stack, 'ChatController');
                        res.write(`data: ${JSON.stringify({ error: { message: err.message } })}\n\n`);
                        res.end();
                    },
                    complete: () => {
                        res.write('data: [DONE]\n\n');
                        res.end();
                    },
                });
            } else {
                const response = await this.chatService.createCompletion(body);
                return res.status(HttpStatus.OK).json(response);
            }
        } catch (error) {
            this.logger.error(`Chat completion failed: ${error.message}`, error.stack, 'ChatController');
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                error: {
                    message: error.message,
                    type: 'internal_error',
                },
            });
        }
    }
}
