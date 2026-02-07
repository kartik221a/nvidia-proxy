import { Injectable } from '@nestjs/common';
import { ChatMessage } from '../../../common/interfaces/chat-completion.interface';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class AutoVisionService {
    constructor(private logger: LoggerService) { }

    async processMessages(messages: ChatMessage[]): Promise<ChatMessage[]> {
        return Promise.all(messages.map(async (msg) => {
            if (typeof msg.content === 'string') {
                const filePath = this.extractFilePath(msg.content);
                if (filePath && this.isValidImage(filePath)) {
                    try {
                        const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
                        const ext = path.extname(filePath).slice(1);
                        const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

                        this.logger.log(`Found image path, converted to base64: ${filePath}`, 'AutoVision');

                        return {
                            ...msg,
                            content: [
                                { type: 'text', text: msg.content },
                                {
                                    type: 'image_url',
                                    image_url: { url: `data:${mimeType};base64,${base64}` }
                                }
                            ]
                        };
                    } catch (err) {
                        this.logger.error(`Failed to read image at ${filePath}: ${err.message}`, err.stack, 'AutoVision');
                    }
                }
            }
            return msg;
        }));
    }

    private extractFilePath(text: string): string | null {
        // Basic regex for Windows/WSL paths
        const winPathRegex = /([a-zA-Z]:\\[^:<>|"?* \n]+|(?:\/|\\\\wsl\.localhost\\)[^:<>|"?* \n]+)/g;
        const matches = text.match(winPathRegex);
        return matches ? matches[0] : null;
    }

    private isValidImage(filePath: string): boolean {
        const ext = path.extname(filePath).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    }
}
