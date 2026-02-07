import { Controller, Get } from '@nestjs/common';
import { ModelsService } from './models.service';

@Controller()
export class ModelsController {
    constructor(private readonly modelsService: ModelsService) { }

    @Get('v1/models')
    getModels() {
        return this.modelsService.findAll();
    }

    @Get('nvidia/v1/models')
    getNvidiaModels() {
        return this.getModels();
    }
}
