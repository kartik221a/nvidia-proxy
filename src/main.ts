import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);

    // Increase payload limits
    const { json, urlencoded } = require('body-parser');
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));

    // Enable validation
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
    }));

    // Enable CORS for OpenClaw
    app.enableCors();

    await app.listen(port);
    console.log(`NVIDIA Proxy is running on: http://localhost:${port}`);
}
bootstrap();
