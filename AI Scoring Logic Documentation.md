# AI Scoring Logic Documentation

## Overview

The AI Scoring Logic system uses OpenAI's GPT-4 model to automatically evaluate and score prompt submissions across multiple dimensions. This system provides consistent, objective assessment of prompt quality and generates metadata to enhance discoverability.

## Scoring Dimensions

### 1. Clarity Score (1-10)
Evaluates how clear and unambiguous the prompt instructions are.

**Scoring Criteria:**
- **1-3 (Poor)**: Very unclear, ambiguous, confusing instructions
- **4-6 (Fair)**: Somewhat clear but has ambiguous parts
- **7-8 (Good)**: Clear with minor ambiguities
- **9-10 (Excellent)**: Crystal clear, unambiguous instructions

**Evaluation Factors:**
- Language precision and specificity
- Absence of contradictory instructions
- Clear definition of expected outputs
- Proper use of terminology
- Logical flow of instructions

### 2. Structure Score (1-10)
Assesses the organization and formatting of the prompt.

**Scoring Criteria:**
- **1-3 (Poor)**: Poor structure, hard to follow
- **4-6 (Fair)**: Basic structure, could be better organized
- **7-8 (Good)**: Well-structured with good flow
- **9-10 (Excellent)**: Excellent structure, perfectly organized

**Evaluation Factors:**
- Logical organization of sections
- Proper use of formatting (headers, lists, etc.)
- Clear separation of instructions and examples
- Consistent formatting throughout
- Hierarchical information structure

### 3. Usefulness Score (1-10)
Measures the practical value and applicability of the prompt.

**Scoring Criteria:**
- **1-3 (Poor)**: Not useful, unclear purpose
- **4-6 (Fair)**: Somewhat useful for specific cases
- **7-8 (Good)**: Very useful for intended purpose
- **9-10 (Excellent)**: Extremely valuable, widely applicable

**Evaluation Factors:**
- Practical applicability
- Problem-solving effectiveness
- Versatility and adaptability
- Innovation and creativity
- Real-world value proposition

### 4. Overall Score (1-10)
Comprehensive assessment considering all factors.

**Calculation Method:**
- Weighted average of individual scores
- Additional consideration for:
  - Originality and innovation
  - Completeness of instructions
  - Potential for reuse
  - Educational value

## AI Evaluation Process

### 1. Content Analysis
```typescript
const evaluationPrompt = `
You are an expert AI prompt evaluator. Analyze the following prompt and provide detailed scoring and categorization.

PROMPT TO EVALUATE:
Title: ${title || 'No title provided'}
Description: ${description || 'No description provided'}
Content: ${promptContent}

Please evaluate this prompt on the following criteria (1-10 scale):
[Detailed scoring criteria...]
`;
```

### 2. GPT-4 Model Configuration
```typescript
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
  temperature: 0.3,  // Low temperature for consistent scoring
  max_tokens: 1000,
});
```

### 3. Response Validation
All AI responses are validated using Zod schemas:

```typescript
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
```

## Auto-Tagging System

### Tag Generation Process
The system automatically generates relevant tags based on prompt content:

```typescript
const taggingPrompt = `
Analyze the following prompt and generate relevant tags that describe its purpose, domain, and characteristics.

Generate up to 10 relevant tags that would help users discover this prompt. Consider:
- The domain/field (e.g., marketing, coding, writing, analysis)
- The task type (e.g., generation, analysis, summarization, translation)
- The output format (e.g., json, markdown, code, essay)
- The complexity level
- Any specific techniques or approaches used
`;
```

### Tag Categories
- **Domain Tags**: marketing, coding, writing, analysis, design
- **Task Tags**: generation, analysis, summarization, translation, optimization
- **Format Tags**: json, markdown, code, essay, list, table
- **Complexity Tags**: beginner, intermediate, advanced, expert
- **Technique Tags**: few-shot, chain-of-thought, role-playing, step-by-step

### Tag Validation
```typescript
const autoTagSchema = z.object({
  tags: z.array(z.string()).max(10),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});
```

## Category Classification

### Automatic Categorization
The AI system classifies prompts into predefined categories:

- **Creative**: Writing, storytelling, brainstorming, artistic content
- **Technical**: Programming, debugging, system design, documentation
- **Business**: Strategy, analysis, planning, communication
- **Educational**: Teaching, explaining, tutorials, assessments
- **Other**: Prompts that don't fit standard categories

### Classification Logic
```typescript
// Category determination based on content analysis
const categoryKeywords = {
  creative: ['story', 'creative', 'write', 'brainstorm', 'imagine'],
  technical: ['code', 'debug', 'system', 'algorithm', 'programming'],
  business: ['strategy', 'analysis', 'market', 'plan', 'business'],
  educational: ['explain', 'teach', 'learn', 'tutorial', 'lesson'],
};
```

## Complexity Assessment

### Complexity Levels
- **Beginner**: Simple, straightforward prompts requiring basic understanding
- **Intermediate**: Moderate complexity with some domain knowledge required
- **Advanced**: Complex prompts requiring specialized expertise

### Assessment Criteria
- **Vocabulary Complexity**: Technical terminology usage
- **Instruction Depth**: Number of steps and sub-tasks
- **Domain Expertise**: Required background knowledge
- **Output Sophistication**: Complexity of expected results

## Token Estimation

### Estimation Algorithm
```typescript
// Rough token estimation (1 token ≈ 4 characters)
const estimatedTokens = Math.ceil(promptContent.length / 4);

// More sophisticated estimation considering:
// - Instruction complexity
// - Expected output length
// - Context requirements
```

### Usage Considerations
- Helps users understand prompt cost implications
- Guides optimization recommendations
- Informs pricing models

## Error Handling and Fallbacks

### Evaluation Failures
When AI evaluation fails, the system provides default scores:

```typescript
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
  estimatedTokens: Math.ceil(promptContent.length / 4),
};
```

### Rate Limiting
```typescript
// Batch processing with rate limiting
const batchSize = 5;
for (let i = 0; i < prompts.length; i += batchSize) {
  const batch = prompts.slice(i, i + batchSize);
  const batchResults = await Promise.all(batchPromises);
  
  // Add delay between batches
  if (i + batchSize < prompts.length) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

## Quality Assurance

### Consistency Checks
- **Score Validation**: Ensure scores are within valid ranges
- **Reasoning Quality**: Verify explanations are meaningful
- **Tag Relevance**: Check tag appropriateness
- **Category Accuracy**: Validate category assignments

### Human Review Process
- **High-Impact Prompts**: Manual review for featured content
- **Score Disputes**: Human override capability
- **Quality Feedback**: User rating system for AI assessments

## Performance Optimization

### Caching Strategy
```typescript
// Cache evaluation results to avoid re-processing
const cacheKey = `evaluation:${hash(promptContent)}`;
const cachedResult = await redis.get(cacheKey);

if (cachedResult) {
  return JSON.parse(cachedResult);
}

const result = await evaluatePrompt(promptContent);
await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 1 hour cache
```

### Batch Processing
- Process multiple prompts simultaneously
- Implement queue system for high-volume scenarios
- Use worker processes for background evaluation

## Analytics and Insights

### Scoring Statistics
```typescript
function calculateScoringStats(scores: PromptScore[]) {
  return {
    averages: {
      clarity: scores.reduce((sum, s) => sum + s.clarity, 0) / scores.length,
      structure: scores.reduce((sum, s) => sum + s.structure, 0) / scores.length,
      usefulness: scores.reduce((sum, s) => sum + s.usefulness, 0) / scores.length,
      overall: scores.reduce((sum, s) => sum + s.overall, 0) / scores.length,
    },
    distributions: calculateDistributions(scores),
    topTags: calculateTopTags(scores),
    categoryDistribution: calculateCategoryDistribution(scores),
  };
}
```

### Usage Metrics
- Evaluation request volume
- Success/failure rates
- Processing time statistics
- Cost analysis

## API Integration

### Evaluation Endpoint
```typescript
POST /api/evaluate-prompt
{
  "content": "string",
  "title": "string (optional)",
  "description": "string (optional)"
}

Response:
{
  "clarity": number,
  "structure": number,
  "usefulness": number,
  "overall": number,
  "reasoning": {
    "clarity": "string",
    "structure": "string",
    "usefulness": "string",
    "overall": "string"
  },
  "suggestedTags": ["string"],
  "category": "string",
  "complexity": "string",
  "estimatedTokens": number
}
```

### Batch Evaluation Endpoint
```typescript
POST /api/evaluate-prompts-batch
{
  "prompts": [
    {
      "id": "string",
      "content": "string",
      "title": "string (optional)",
      "description": "string (optional)"
    }
  ]
}
```

## Configuration

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
AI_EVALUATION_MODEL=gpt-4
AI_EVALUATION_TEMPERATURE=0.3
AI_EVALUATION_MAX_TOKENS=1000
EVALUATION_CACHE_TTL=3600
BATCH_SIZE=5
RATE_LIMIT_DELAY=1000
```

### Model Configuration
```typescript
const modelConfig = {
  model: process.env.AI_EVALUATION_MODEL || 'gpt-4',
  temperature: parseFloat(process.env.AI_EVALUATION_TEMPERATURE || '0.3'),
  max_tokens: parseInt(process.env.AI_EVALUATION_MAX_TOKENS || '1000'),
};
```

## Future Enhancements

### Planned Improvements
- **Multi-Model Evaluation**: Compare results across different AI models
- **Custom Scoring Criteria**: User-defined evaluation dimensions
- **Learning from Feedback**: Improve scoring based on user ratings
- **Domain-Specific Scoring**: Specialized evaluation for different fields
- **Real-Time Evaluation**: Instant scoring during prompt composition

### Research Areas
- **Bias Detection**: Identify and mitigate evaluation biases
- **Prompt Optimization**: Suggest improvements based on scoring
- **Semantic Similarity**: Compare prompts for duplicate detection
- **Quality Prediction**: Predict prompt success before publication

