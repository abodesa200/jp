import { generateOpenApiSpec } from '@/server/lib/openapi/generator';

/**
 * GET /api/openapi
 * 
 * Returns OpenAPI specification (auto-generated from @ts-rest contracts)
 * 
 * Usage:
 * - Import to Postman: http://localhost:3000/api/openapi
 * - View in Swagger UI
 * - Generate client SDKs
 * 
 * ✨ الآن كل شي تلقائي من الـ contracts!
 */
export async function GET() {
    try {
        const spec = generateOpenApiSpec();

        return Response.json(spec, {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // للسماح بالوصول من Postman
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error('Error generating OpenAPI spec:', error);
        return Response.json(
            {
                error: 'Failed to generate OpenAPI spec',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
