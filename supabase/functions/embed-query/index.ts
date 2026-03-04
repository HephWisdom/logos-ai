const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey =
      Deno.env.get('GROQ_API_KEY') ??
      Deno.env.get('OPENAI_API_KEY') ??
      Deno.env.get('EMBEDDING_API_KEY');

    const apiBase = Deno.env.get('EMBEDDING_API_BASE') ?? 'https://api.groq.com/openai/v1';
    const model = Deno.env.get('EMBEDDING_MODEL') ?? 'nomic-embed-text';

    const localHosts = ['localhost', '127.0.0.1', 'host.docker.internal'];
    const isLocalBase = localHosts.some((host) => apiBase.includes(host));

    if (!apiKey && !isLocalBase) {
      return new Response(JSON.stringify({ error: 'Missing embedding API key in function secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${apiBase}/embeddings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        input: query,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return new Response(JSON.stringify({ error: `Embedding provider error: ${body}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const embedding = data?.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      return new Response(JSON.stringify({ error: 'Invalid embedding response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ embedding, model }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
