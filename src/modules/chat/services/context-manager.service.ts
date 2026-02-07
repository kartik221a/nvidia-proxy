import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from '../../../common/interfaces/chat-completion.interface';
import { TokenEstimator } from '../../../common/utils/token-estimator';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class ContextManagerService {
    private readonly maxTokens: number;

    constructor(
        private configService: ConfigService,
        private logger: LoggerService,
    ) {
        this.maxTokens = this.configService.get<number>('maxContextTokens', 100000);
    }

    truncateMessages(messages: ChatMessage[]): ChatMessage[] {
        const systemMessages = messages.filter(m => m.role === 'system');
        const otherMessages = messages.filter(m => m.role !== 'system');

        let currentTokens = systemMessages.reduce(
            (sum, m) => sum + TokenEstimator.estimateMessageTokens(m),
            0
        );

        const truncated: ChatMessage[] = [];

        // Process messages from newest to oldest
        for (let i = otherMessages.length - 1; i >= 0; i--) {
            const msgTokens = TokenEstimator.estimateMessageTokens(otherMessages[i]);
            if (currentTokens + msgTokens > this.maxTokens) {
                this.logger.warn(`Truncating context: reached ${this.maxTokens} tokens`, 'ContextManager');
                break;
            }
            truncated.unshift(otherMessages[i]);
            currentTokens += msgTokens;
        }

        return [...systemMessages, ...truncated];
    }
}
