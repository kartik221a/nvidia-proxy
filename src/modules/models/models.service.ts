import { Injectable } from '@nestjs/common';
import { MODELS } from '../../config/models.config';

@Injectable()
export class ModelsService {
    findAll() {
        return {
            object: 'list',
            data: MODELS.map(model => ({
                id: model.id,
                object: 'model',
                created: model.created || Math.floor(Date.now() / 1000),
                owned_by: model.owner,
            })),
        };
    }
}
