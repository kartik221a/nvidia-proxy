import { Injectable } from '@nestjs/common';
import { ToolCall } from '../../../common/interfaces/tool-call.interface';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class ToolParserService {
    constructor(private logger: LoggerService) { }

    parseToolCalls(text: string): ToolCall[] {
        const toolCalls: ToolCall[] = [];

        // 1. XML Format: <tool_call><function=NAME>ARGS</function></tool_call>
        const xmlRegex = /<tool_call><function=(.*?)>(.*?)<\/function><\/tool_call>/g;
        let match;
        while ((match = xmlRegex.exec(text)) !== null) {
            toolCalls.push({
                id: `call_${Math.random().toString(36).substr(2, 9)}`,
                type: 'function',
                function: {
                    name: match[1],
                    arguments: match[2],
                },
            });
        }

        // 2. DSML Format: <｜DSML｜function_calls>[{"name": "...", "parameters": {...}}]</｜DSML｜function_calls>
        const dsmlRegex = /<｜DSML｜function_calls>(.*?)<\/｜DSML｜function_calls>/gs;
        while ((match = dsmlRegex.exec(text)) !== null) {
            try {
                const calls = JSON.parse(match[1]);
                if (Array.isArray(calls)) {
                    calls.forEach(call => {
                        toolCalls.push({
                            id: `call_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'function',
                            function: {
                                name: call.name,
                                arguments: typeof call.parameters === 'string'
                                    ? call.parameters
                                    : JSON.stringify(call.parameters),
                            },
                        });
                    });
                }
            } catch (e) {
                this.logger.error('Failed to parse DSML tool calls', e.stack, 'ToolParser');
            }
        }

        if (toolCalls.length > 0) {
            this.logger.log(`Parsed ${toolCalls.length} tool calls`, 'ToolParser');
        }

        return toolCalls;
    }

    isToolCall(text: string): boolean {
        return text.includes('<tool_call>') || text.includes('<｜DSML｜function_calls>');
    }
}
