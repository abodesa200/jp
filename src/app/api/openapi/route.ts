import { generateOpenApiSpec } from "@/server/lib/openapi/generator";


export async function GET() {
  return Response.json(
    generateOpenApiSpec()
  )
}