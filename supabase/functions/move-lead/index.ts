import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req: Request) => {
  try {
    const { lead_id, new_stage_id } = await req.json();

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

    // Campos obrigatórios
    const { data: required } = await supabase
      .from("stage_required_fields")
      .select("*")
      .eq("stage_id", new_stage_id);

    for (const field of required || []) {
      if (field.field_type === "standard") {
        if (!lead[field.field_key]) {
          return new Response(
            JSON.stringify({ error: `Campo obrigatório: ${field.field_key}` }),
            { status: 400 }
          );
        }
      }
    }

    // Atualiza etapa
    await supabase
      .from("leads")
      .update({ stage_id: new_stage_id })
      .eq("id", lead_id);

    // Buscar campanhas com gatilho
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("*")
      .eq("trigger_stage_id", new_stage_id)
      .eq("active", true);

    for (const campaign of campaigns || []) {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          lead_id,
          campaign_id: campaign.id,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
