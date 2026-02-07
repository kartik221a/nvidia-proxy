import { Injectable, LoggerService as NestLoggerService, ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService extends ConsoleLogger implements NestLoggerService {
    private logFilePath: string;

    constructor(private configService: ConfigService) {
        super();
        const logFile = this.configService.get<string>('logFile', 'proxy.log');
        this.logFilePath = path.isAbsolute(logFile)
            ? logFile
            : path.join(process.cwd(), logFile);
    }

    log(message: any, context?: string) {
        super.log(message, context);
        this.writeToFile('INFO', message, context);
    }

    error(message: any, stack?: string, context?: string) {
        super.error(message, stack, context);
        this.writeToFile('ERROR', message, context, stack);
    }

    warn(message: any, context?: string) {
        super.warn(message, context);
        this.writeToFile('WARN', message, context);
    }

    debug(message: any, context?: string) {
        super.debug(message, context);
        this.writeToFile('DEBUG', message, context);
    }

    private writeToFile(level: string, message: any, context?: string, stack?: string) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` [${context}]` : '';
        const stackStr = stack ? `\n${stack}` : '';
        const logEntry = `${timestamp} ${level.padEnd(5)}${contextStr}: ${message}${stackStr}\n`;

        try {
            fs.appendFileSync(this.logFilePath, logEntry);
        } catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }
}
