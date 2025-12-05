import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  fileName: string;
  fileType: string;
  folder: 'images' | 'videos';
}

interface UploadResponse {
  success: boolean;
  uploadUrl?: string;
  fileUrl?: string;
  key?: string;
  error?: string;
}

// Helper to generate presigned URL for R2
async function generatePresignedUrl(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucketName: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const region = 'auto'; // R2 uses 'auto' region
  const service = 's3';
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const host = `${accountId}.r2.cloudflarestorage.com`;

  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = timestamp.slice(0, 8);

  // Create canonical request
  const method = 'PUT';
  const canonicalUri = `/${bucketName}/${key}`;
  const canonicalQueryString = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(accessKeyId)}%2F${date}%2F${region}%2F${service}%2Faws4_request&X-Amz-Date=${timestamp}&X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=host`;
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  // Create string to sign
  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const hashedCanonicalRequest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonicalRequest)
  );
  const hashedCanonicalRequestHex = Array.from(new Uint8Array(hashedCanonicalRequest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequestHex}`;

  // Calculate signature
  async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
    return new Uint8Array(signature);
  }

  const kDate = await hmacSha256(
    new TextEncoder().encode(`AWS4${secretAccessKey}`),
    date
  );
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, 'aws4_request');
  const signature = await hmacSha256(kSigning, stringToSign);

  const signatureHex = Array.from(signature)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Build presigned URL
  const presignedUrl = `${endpoint}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signatureHex}`;

  return presignedUrl;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
    const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY')!;
    const bucketName = Deno.env.get('CLOUDFLARE_R2_BUCKET_NAME')!;
    const publicUrl = Deno.env.get('CLOUDFLARE_R2_PUBLIC_URL')!;

    // Verify all credentials are present
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing R2 configuration. Please check environment variables.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create service role client for auth verification
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse request body
    const body: UploadRequest = await req.json();

    if (!body.fileName || !body.fileType || !body.folder) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: fileName, fileType, folder' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate folder
    if (body.folder !== 'images' && body.folder !== 'videos') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid folder. Must be "images" or "videos"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate unique key for the file
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = body.fileName.split('.').pop();
    const key = `${body.folder}/${timestamp}-${randomStr}.${extension}`;

    console.log(`[UPLOAD-R2] Generating presigned URL for key: ${key}`);

    // Generate presigned URL for upload
    const uploadUrl = await generatePresignedUrl(
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      key,
      3600 // 1 hour expiry
    );

    // Construct the public URL for accessing the file
    const fileUrl = `${publicUrl}/${key}`;

    console.log(`[UPLOAD-R2] ✅ Presigned URL generated successfully`);
    console.log(`[UPLOAD-R2] Public URL: ${fileUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl,
        fileUrl,
        key
      } as UploadResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[UPLOAD-R2] Error:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
