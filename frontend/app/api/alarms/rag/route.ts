import { NextRequest, NextResponse } from 'next/server';
import { getPineconeIndex } from '@/lib/pinecone';
import { createEmbedding } from '@/lib/embeddings';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RAGRequest {
  alarm_type: string;
  machine_type: 'bottlefiller' | 'lathe';
  state: 'RAISED' | 'CLEARED';
  machine_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RAGRequest = await request.json();
    const { alarm_type, machine_type, state, machine_id } = body;

    if (!alarm_type || !machine_type || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: alarm_type, machine_type, state' },
        { status: 400 }
      );
    }

    // Create query embedding
    const queryText = `${alarm_type} alarm for ${machine_type} machine ${state}`;
    const queryEmbedding = await createEmbedding(queryText);

    // Query Pinecone
    const index = await getPineconeIndex();
    
    // Filter by machine type and alarm name (normalize alarm name)
    const normalizedAlarmName = alarm_type.startsWith('Alarm') 
      ? alarm_type 
      : `Alarm${alarm_type}`;
    
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
      filter: {
        machine_type: { $eq: machine_type },
        alarm_name: { $eq: normalizedAlarmName },
      },
    });

    // Extract relevant chunks
    const chunks = queryResponse.matches.map((match: any) => ({
      content: match.metadata?.content || '',
      score: match.score,
      alarm_name: match.metadata?.alarm_name || '',
      severity: match.metadata?.severity || '',
    }));

    if (chunks.length === 0) {
      return NextResponse.json({
        instructions: `No specific instructions found for ${alarm_type} on ${machine_type}. Please refer to the general alarm response procedures.`,
        chunks: [],
      });
    }

    // Generate response using LLM
    const context = chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n');
    
    const prompt = `You are an industrial automation expert. Based on the following alarm response procedures from the manual, provide clear, actionable instructions for operators.

Alarm: ${alarm_type}
Machine Type: ${machine_type}
State: ${state}
Machine ID: ${machine_id || 'N/A'}

Relevant Procedures:
${context}

${state === 'RAISED' 
  ? `Provide a well-structured response with the following sections. Write in clear, professional prose - NOT just bullet points. Use full sentences and paragraphs where appropriate:

**IMMEDIATE ACTIONS**
Write 2-4 critical immediate actions that must be taken right away. Use full sentences, not bullet points. Start each action with a clear imperative verb (e.g., "STOP the operation...", "Check the indicator...", "Verify the sensor..."). Each action should be a complete sentence explaining what to do and why.

**TROUBLESHOOTING STEPS**
Provide 3-5 key troubleshooting steps. Write each step as a complete sentence or short paragraph explaining what to check, how to check it, and what to look for. Be specific and actionable. Use full sentences, not bullet points.

**RESOLUTION STEPS**
Provide step-by-step resolution instructions. Write each step as a complete sentence or short paragraph. Include specific actions, settings, or procedures. Explain what to do, how to do it, and what to expect. Use full sentences, not bullet points.

**IMPORTANT NOTES**
Add any critical warnings, safety considerations, or important reminders. Write in complete sentences.`

  : `Provide a well-structured response with the following sections. Write in clear, professional prose - NOT just bullet points. Use full sentences and paragraphs where appropriate:

**STATUS CONFIRMATION**
Confirm that the alarm has been cleared and what this means. Write in complete sentences, not bullet points.

**VERIFICATION STEPS**
Provide 3-5 verification steps to ensure the issue is fully resolved. Write each step as a complete sentence or short paragraph explaining what to verify, how to verify it, and what indicates success. Use full sentences, not bullet points.

**POST-RESOLUTION CHECKS**
List any follow-up checks or monitoring that should be performed. Write in complete sentences, explaining what to monitor and for how long. Use full sentences, not bullet points.

**IMPORTANT NOTES**
Add any important reminders or preventive measures. Write in complete sentences.`}

IMPORTANT FORMATTING RULES:
- Use **bold headers** for section titles (e.g., **IMMEDIATE ACTIONS**)
- Write in complete sentences and paragraphs, NOT bullet points
- Use numbered lists (1., 2., 3.) ONLY when listing sequential steps that must be followed in order
- For most content, use full sentences and paragraphs
- Be specific, actionable, and professional
- Each instruction should be clear and self-contained`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a technical documentation expert specializing in industrial automation alarm response procedures.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const instructions = completion.choices[0]?.message?.content || 'Unable to generate instructions.';

    return NextResponse.json({
      instructions,
      chunks: chunks.map(c => ({
        alarm_name: c.alarm_name,
        severity: c.severity,
        score: c.score,
      })),
      alarm_type,
      machine_type,
      state,
    });
  } catch (error: any) {
    console.error('RAG API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve alarm instructions' },
      { status: 500 }
    );
  }
}

