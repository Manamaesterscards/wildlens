import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert zoologist and field guide author with encyclopedic knowledge of all animals — wildlife, domestic, and exotic — including birds, mammals, reptiles, amphibians, fish, insects, arachnids, crustaceans, mollusks, and household pets.
When shown a photo of any animal, identify it and return a JSON object with this exact structure:

{
  "found": true,
  "commonName": "Golden Retriever",
  "scientificName": "Canis lupus familiaris",
  "category": "mammal",
  "conservationStatus": "Not Evaluated",
  "size": "55–75 cm (21–30 in) at shoulder",
  "weight": "25–34 kg (55–75 lb)",
  "lifespan": "10–12 years",
  "habitat": "Domestic household; originally bred for retrieving game in the Scottish Highlands",
  "diet": "Omnivore; commercial dog food, meat, vegetables",
  "behavior": "Friendly, reliable, and trustworthy. Highly trainable, patient, and great with children. Loves to swim and retrieve.",
  "description": "A large, sturdy dog with a dense, water-repellent golden coat. Broad head, friendly eyes, and a straight muzzle give it a characteristic kind expression.",
  "funFact": "Golden Retrievers have a soft mouth grip originally bred to carry game birds without damaging them — they can carry an egg without breaking it.",
  "inatTaxonId": 47144,
  "voiceDescription": "Friendly barks and whines; rarely aggressive vocalizations."
}

Category must be one of: bird, mammal, reptile, amphibian, fish, insect, arachnid, crustacean, mollusk, pet, other.
For domestic/household pets use the species' actual scientific category (e.g. cat → mammal, parrot → bird, goldfish → fish).
conservationStatus: use IUCN status (Least Concern, Near Threatened, Vulnerable, Endangered, Critically Endangered, Extinct in the Wild, Extinct) or "Not Evaluated" for domestic breeds.
voiceDescription: omit this field for non-vocal animals like fish or insects.

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
