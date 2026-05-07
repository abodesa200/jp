#!/usr/bin/env tsx
/**
 * Script لتوليد ملف openapi.json من الـ @ts-rest contracts
 * 
 * الآن كل شي تلقائي! ✨
 * - ما تحتاج تستورد ملفات يدوياً
 * - كل الـ contracts موجودة في @/contracts
 * 
 * Usage:
 *   pnpm generate:openapi
 */

import { generateOpenApiSpec } from '@/server/lib/openapi/generator';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function main() {
    console.log('🔄 Generating OpenAPI spec from @ts-rest contracts...');

    try {
        const spec = generateOpenApiSpec();

        // حفظ كـ JSON
        const jsonPath = join(process.cwd(), 'openapi.json');
        writeFileSync(jsonPath, JSON.stringify(spec, null, 2), 'utf-8');
        console.log('✅ Generated:', jsonPath);

        // إحصائيات
        const paths = Object.keys(spec.paths || {});
        const endpoints = paths.reduce((acc, path) => {
            const methods = Object.keys(spec.paths?.[path] || {});
            return acc + methods.length;
        }, 0);

        console.log('\n📊 Statistics:');
        console.log(`   - Total paths: ${paths.length}`);
        console.log(`   - Total endpoints: ${endpoints}`);
        console.log(`   - Schemas: ${Object.keys(spec.components?.schemas || {}).length}`);

        console.log('\n📝 Import to Postman:');
        console.log('   1. Open Postman');
        console.log('   2. Import > Link > http://localhost:3000/api/openapi');
        console.log('   3. Or import the generated openapi.json file');

        console.log('\n✨ All done! OpenAPI spec generated automatically from contracts.');

    } catch (error) {
        console.error('❌ Error generating OpenAPI spec:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);
        }
        process.exit(1);
    }
}

main();
