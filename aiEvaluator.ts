import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Scoring schema
const scoringSchema = z.object({
  clarity: z.number().min(1).max(10),
  structure: z.number().min(1).max(10),
  usefulness: z.number().min(1).max(10),
  overall: z.number().min(1).max(10),
  reasoning: z.object({
    clarity: z.string(),
    structure: z.string(),
    usefulness: z.string(),
    overall: z.string(),
  }),
  suggestedTags: z.array(z.string()).max(10),
  category: z.enum(['creative', 'technical', 'business', 'educational', 'other']),
  complexity: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTokens: z.number().optional(),
});

export type PromptScore = z.infer<typeof scoringSchema>;

// Auto-tagging schema
const autoTagSchema = z.object({
  tags: z.array(z.string()).max(10),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type AutoTagResult = z.infer<typeof autoTagSchema>;

/**
 * Evaluates a prompt using OpenAI GPT-4 for scoring on multiple criteria
 */
export async function evaluatePrompt(
  promptContent: string,
  title?: string,
  description?: string
): Promise<PromptScore> {
  try {
    const evaluationPrompt = `
You are an expert AI prompt evaluator. Analyze the following prompt and provide detailed scoring and categorization.

PROMPT TO EVALUATE:
Title: ${title || 'No title provided'}
Description: ${description || 'No description provided'}
Content: ${promptContent}

Please evaluate this prompt on the following criteria (1-10 scale):

1. CLARITY (1-10): How clear and unambiguous are the instructions?
   - 1-3: Very unclear, ambiguous, confusing
   - 4-6: Somewhat clear but has ambiguous parts
   - 7-8: Clear with minor ambiguities
   - 9-10: Crystal clear, unambiguous

2. STRUCTURE (1-10): How well-organized and formatted is the prompt?
   - 1-3: Poor structure, hard to follow
   - 4-6: Basic structure, could be better organized
   - 7-8: Well-structured with good flow
   - 9-10: Excellent structure, perfectly organized

3. USEFULNESS (1-10): How practical and valuable is this prompt?
   - 1-3: Not useful, unclear purpose
   - 4-6: Somewhat useful for specific cases
   - 7-8: Very useful for intended purpose
   - 9-10: Extremely valuable, widely applicable

4. OVERALL (1-10): Overall quality considering all factors

Also provide:
- Suggested tags (up to 10) that best describe this prompt
- Category: creative, technical, business, educational, or other
- Complexity level: beginner, intermediate, or advanced
- Estimated token count for typical usage

Respond with a JSON object matching this exact structure:
{
  "clarity": number,
  "structure": number,
  "usefulness": number,
  "overall": number,
  "reasoning": {
    "clarity": "explanation for clarity score",
    "structure": "explanation for structure score", 
    "usefulness": "explanation for usefulness score",
    "overall": "explanation for overall score"
  },
  "suggestedTags": ["tag1", "tag2", ...],
  "category": "category_name",
  "complexity": "complexity_level",
  "estimatedTokens": number
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI prompt evaluator. Always respond with valid JSON matching the requested schema.'
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}`);
    }

    // Validate against schema
    const validatedScore = scoringSchema.parse(parsedResponse);
    
    return validatedScore;

  } catch (error) {
    console.error('Error evaluating prompt:', error);
    
    // Return default scores if evaluation fails
    return {
      clarity: 5,
      structure: 5,
      usefulness: 5,
      overall: 5,
      reasoning: {
        clarity: 'Evaluation failed - default score assigned',
        structure: 'Evaluation failed - default score assigned',
        usefulness: 'Evaluation failed - default score assigned',
        overall: 'Evaluation failed - default score assigned',
      },
      suggestedTags: ['untagged'],
      category: 'other',
      complexity: 'intermediate',
      estimatedTokens: Math.ceil(promptContent.length / 4), // Rough estimate
    };
  }
}

/**
 * Generates automatic tags for a prompt based on its content
 */
export async function generateAutoTags(
  promptContent: string,
  title?: string,
  description?: string
): Promise<AutoTagResult> {
  try {
    const taggingPrompt = `
Analyze the following prompt and generate relevant tags that describe its purpose, domain, and characteristics.

PROMPT TO TAG:
Title: ${title || 'No title provided'}
Description: ${description || 'No description provided'}
Content: ${promptContent}

Generate up to 10 relevant tags that would help users discover this prompt. Consider:
- The domain/field (e.g., marketing, coding, writing, analysis)
- The task type (e.g., generation, analysis, summarization, translation)
- The output format (e.g., json, markdown, code, essay)
- The complexity level
- Any specific techniques or approaches used

Respond with a JSON object:
{
  "tags": ["tag1", "tag2", ...],
  "confidence": 0.95,
  "reasoning": "explanation of why these tags were chosen"
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at categorizing and tagging AI prompts. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: taggingPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const parsedResponse = JSON.parse(responseContent);
    const validatedResult = autoTagSchema.parse(parsedResponse);
    
    return validatedResult;

  } catch (error) {
    console.error('Error generating auto tags:', error);
    
    // Return default tags if generation fails
    return {
      tags: ['prompt', 'untagged'],
      confidence: 0.1,
      reasoning: 'Auto-tagging failed - default tags assigned',
    };
  }
}

/**
 * Batch evaluate multiple prompts
 */
export async function batchEvaluatePrompts(
  prompts: Array<{
    content: string;
    title?: string;
    description?: string;
    id: string;
  }>
): Promise<Array<{ id: string; score: PromptScore; error?: string }>> {
  const results = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (prompt) => {
      try {
        const score = await evaluatePrompt(
          prompt.content,
          prompt.title,
          prompt.description
        );
        return { id: prompt.id, score };
      } catch (error) {
        return {
          id: prompt.id,
          score: {
            clarity: 1,
            structure: 1,
            usefulness: 1,
            overall: 1,
            reasoning: {
              clarity: 'Evaluation failed',
              structure: 'Evaluation failed',
              usefulness: 'Evaluation failed',
              overall: 'Evaluation failed',
            },
            suggestedTags: ['error'],
            category: 'other' as const,
            complexity: 'intermediate' as const,
          },
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Get scoring statistics for a set of prompts
 */
export function calculateScoringStats(scores: PromptScore[]): {
  averages: {
    clarity: number;
    structure: number;
    usefulness: number;
    overall: number;
  };
  distributions: {
    clarity: Record<string, number>;
    structure: Record<string, number>;
    usefulness: Record<string, number>;
    overall: Record<string, number>;
  };
  topTags: Array<{ tag: string; count: number }>;
  categoryDistribution: Record<string, number>;
} {
  if (scores.length === 0) {
    return {
      averages: { clarity: 0, structure: 0, usefulness: 0, overall: 0 },
      distributions: { clarity: {}, structure: {}, usefulness: {}, overall: {} },
      topTags: [],
      categoryDistribution: {},
    };
  }

  // Calculate averages
  const averages = {
    clarity: scores.reduce((sum, s) => sum + s.clarity, 0) / scores.length,
    structure: scores.reduce((sum, s) => sum + s.structure, 0) / scores.length,
    usefulness: scores.reduce((sum, s) => sum + s.usefulness, 0) / scores.length,
    overall: scores.reduce((sum, s) => sum + s.overall, 0) / scores.length,
  };

  // Calculate distributions (score ranges)
  const distributions = {
    clarity: {},
    structure: {},
    usefulness: {},
    overall: {},
  } as Record<string, Record<string, number>>;

  scores.forEach(score => {
    ['clarity', 'structure', 'usefulness', 'overall'].forEach(metric => {
      const value = score[metric as keyof typeof score] as number;
      const range = `${Math.floor((value - 1) / 2) * 2 + 1}-${Math.floor((value - 1) / 2) * 2 + 2}`;
      distributions[metric][range] = (distributions[metric][range] || 0) + 1;
    });
  });

  // Calculate top tags
  const tagCounts: Record<string, number> = {};
  scores.forEach(score => {
    score.suggestedTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Calculate category distribution
  const categoryDistribution: Record<string, number> = {};
  scores.forEach(score => {
    categoryDistribution[score.category] = (categoryDistribution[score.category] || 0) + 1;
  });

  return {
    averages,
    distributions,
    topTags,
    categoryDistribution,
  };
}

