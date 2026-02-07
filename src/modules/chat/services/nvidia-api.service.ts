import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ChatCompletionRequest } from '../../../common/interfaces/chat-completion.interface';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class NvidiaApiService {
    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
        private logger: LoggerService,
    ) {
        this.apiKey = this.configService.get<string>('nvidia.apiKey');
        this.baseUrl = this.configService.get<string>('nvidia.baseUrl');
    }

    async createCompletion(request: ChatCompletionRequest): Promise<AxiosResponse> {
        const url = `${this.baseUrl}/chat/completions`;

        this.logger.debug(`Calling NVIDIA API: ${url} for model ${request.model}`, 'NvidiaApiService');

        try {
            this.logger.debug(`Sending POST request to ${url}...`, 'NvidiaApiService');
            const response = await firstValueFrom<AxiosResponse>(
                this.httpService.post(url, request, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': request.stream ? 'text/event-stream' : 'application/json',
                    },
                    responseType: request.stream ? 'stream' : 'json',
                })
            );
            this.logger.debug(`NVIDIA API response status: ${response.status}`, 'NvidiaApiService');
            return response;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            this.logger.error(`NVIDIA API call failed: ${errorMsg}`, error.stack, 'NvidiaApiService');
            throw new Error(`NVIDIA API Error: ${errorMsg}`);
        }
    }
}
