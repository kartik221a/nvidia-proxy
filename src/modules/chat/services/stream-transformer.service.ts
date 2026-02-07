import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatCompletionChunk } from '../../../common/interfaces/chat-completion.interface';
import { LoggerService } from '../../logger/logger.service';
import * as Readline from 'readline';

@Injectable()
export class StreamTransformerService {
    constructor(private logger: LoggerService) { }

    transformStream(inputStream: any, model: string): Observable<ChatCompletionChunk> {
        const id = `chatcmpl-${Math.random().toString(36).substr(2, 9)}`;
        const created = Math.floor(Date.now() / 1000);

        this.logger.debug(`Starting stream transformation for model: ${model}`, 'StreamTransformer');

        return new Observable(subscriber => {
            const rl = Readline.createInterface({
                input: inputStream,
                terminal: false,
            });

            rl.on('line', (line) => {
                this.logger.debug(`Raw stream line: ${line}`, 'StreamTransformer');

                if (!line.trim()) {
                    return; // Skip empty lines
                }

                if (!line.startsWith('data: ')) {
                    this.logger.warn(`Skipping line (does not start with 'data: '): ${line}`, 'StreamTransformer');
                    return;
                }

                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                    this.logger.debug('Received [DONE] signal', 'StreamTransformer');
                    subscriber.complete();
                    return;
                }

                try {
                    const json = JSON.parse(data);
                    const chunk: ChatCompletionChunk = {
                        id: json.id || id,
                        object: 'chat.completion.chunk',
                        created: json.created || created,
                        model: json.model || model,
                        choices: (json.choices || []).map(choice => ({
                            index: choice.index || 0,
                            delta: choice.delta || choice.message || {},
                            finish_reason: choice.finish_reason || null,
                        })),
                    };
                    subscriber.next(chunk);
                } catch (e) {
                    this.logger.error(`Failed to parse stream chunk: ${data}`, e.stack, 'StreamTransformer');
                }
            });

            rl.on('error', (err) => {
                this.logger.error(`Readline error: ${err.message}`, err.stack, 'StreamTransformer');
                subscriber.error(err);
            });

            rl.on('close', () => {
                this.logger.debug('Stream closed', 'StreamTransformer');
                subscriber.complete();
            });

            return () => rl.close();
        });
    }
}
