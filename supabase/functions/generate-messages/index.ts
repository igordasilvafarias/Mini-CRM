import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  try {
    const { lead_id, campaign_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar lead
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    // Campos customizados
    const { data: customValues } = await supabase
      .from("lead_custom_values")
      .select("value, custom_fields(name)")
      .eq("lead_id", lead_id);

    // Campanha
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    // Montar contexto do lead
    let leadInfo = `
      Nome: ${lead.name}
      Empresa: ${lead.company}
      Cargo: ${lead.role}
      Email: ${lead.email}
      Telefone: ${lead.phone}
    `;

    for (const field of customValues || []) {
      leadInfo += `${field.custom_fields.name}: ${field.value}\n`;
    }

    const prompt = `
      Você é um SDR profissional.

      CONTEXTO DA CAMPANHA:
      ${campaign.context}

      DADOS DO LEAD:
      ${leadInfo}

      INSTRUÇÕES:
      ${campaign.prompt}

      Gere 3 variações de mensagens de abordagem. 
      Cada mensagem deve ter entre 100 e 150 caracteres. 
      As mensagens devem ser diretas, personalizadas e focadas em iniciar uma conversa com o lead. 
      Evite jargões e linguagem excessivamente formal. 
      Separe cada mensagem por uma nova linha.
    `;

    // OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    const text = result.choices[0].message.content;

    // Separar mensagens
    const messages = text.split("\n").filter((l) => l.trim().length > 5);

    for (const content of messages.slice(0, 3)) {
      await supabase.from("generated_messages").insert({
        lead_id,
        campaign_id,
        content,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
