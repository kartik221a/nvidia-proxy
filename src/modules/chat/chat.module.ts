import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { NvidiaApiService } from './services/nvidia-api.service';
import { ContextManagerService } from './services/context-manager.service';
import { AutoVisionService } from './services/auto-vision.service';
import { ToolParserService } from './services/tool-parser.service';
import { StreamTransformerService } from './services/stream-transformer.service';

@Module({
    imports: [HttpModule],
    controllers: [ChatController],
    providers: [
        ChatService,
        NvidiaApiService,
        ContextManagerService,
        AutoVisionService,
        ToolParserService,
        StreamTransformerService,
    ],
})
export class ChatModule { }
