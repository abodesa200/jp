import {
    OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi'

import { registry } from './registry'
import './setup'
export function generateOpenApiSpec() {
    const generator = new OpenApiGeneratorV3(
        registry.definitions
    )

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            title: 'junior project ',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
         security: [
        {
            bearerAuth: [],
        },
    ],
    })
}


