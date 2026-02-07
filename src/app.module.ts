import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { ChatModule } from './modules/chat/chat.module';
import { ModelsModule } from './modules/models/models.module';
import { LoggerModule } from './modules/logger/logger.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            isGlobal: true,
        }),
        LoggerModule,
        ModelsModule,
        ChatModule,
    ],
})
export class AppModule { }
