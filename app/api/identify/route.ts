import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert wildlife biologist and field guide author specializing in birds, reptiles, and amphibians.
When shown a photo of an animal, identify it and return a JSON object with this exact structure:

{
  "found": true,
  "commonName": "Western Kingbird",
  "scientificName": "Tyrannus verticalis",
  "category": "bird",
  "conservationStatus": "Least Concern",
  "size": "22 cm (8.7 in)",
  "weight": "42 g (1.5 oz)",
  "lifespan": "Up to 6 years",
  "habitat": "Open country, farmland, roadsides, desert shrub",
  "diet": "Insects, small berries",
  "behavior": "Aggressive defender of nest territory, often seen on wire perches sallying out to catch flying insects.",
  "description": "A medium-sized flycatcher with pale gray head and breast, yellow belly, and whitish outer tail feathers. The back is olive-gray.",
  "funFact": "Despite its small size, the Western Kingbird will fearlessly chase hawks and crows away from its nest.",
  "inatTaxonId": 18814,
  "voiceDescription": "A sharp 'whit' or 'kit', also a bickering series of notes."
}

If no animal is visible or you cannot confidently identify it, return:
{ "found": false, "reason": "No identifiable animal detected in the image." }

The inatTaxonId must be the real iNaturalist taxon ID for the species. If unsure, use null.
Return only valid JSON, no markdown or explanation.`;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    // Strip the data URL prefix to get base64 content and media type
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }
    const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    const base64Data = match[2];

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Data },
            },
            { type: "text", text: "Identify the animal in this photo and return the JSON." },
          ],
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const result = JSON.parse(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Identify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
