import { contract } from '@/contracts';
import { generateOpenApi } from '@ts-rest/open-api';

/**
 * توليد OpenAPI spec من الـ @ts-rest contracts
 * 
 * الآن كل شي تلقائي! ✨
 * - ما تحتاج تسجل routes يدوياً
 * - ما تحتاج تكتب schemas يدوياً
 * - كل شي يتولد من الـ contracts
 */
export function generateOpenApiSpec() {
    return generateOpenApi(
        contract,
        {
            info: {
                title: 'Ride Sharing API',
                version: '1.0.0',
                description: `
API documentation for the ride sharing platform

## Categories:
- 🧑 **Rides - Passenger**: APIs for passengers (request ride, view my rides)
- 🚗 **Rides - Driver**: APIs for drivers (nearby rides, accept ride, update status)
- 💰 **Rides - Negotiation**: Price negotiation APIs (shared)
- 📋 **Rides - Shared**: Shared APIs between passenger and driver

## Authentication:
All protected endpoints require JWT token in Authorization header:
\`Authorization: Bearer <token>\`

Get token from \`/api/auth/verify-otp\`
                `.trim(),
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Local development server',
                },
                {
                    url: 'https://your-production-url.com',
                    description: 'Production server',
                },
            ],
        },
        {
            setOperationId: true,
            // JSON Schema options
            jsonQuery: {
                // Include examples in schemas
                target: 'openApi3',
            },
            // Auto-tag based on contract structure
            operationMapper: (operation, appRoute) => {
                const pathParts = appRoute.path.split('/').filter(Boolean);
                const tag = pathParts[1] || 'General'; // e.g., "auth", "rides", "drivers"

                return {
                    ...operation,
                    tags: [tag.charAt(0).toUpperCase() + tag.slice(1)],
                };
            },
        }
    );
}
