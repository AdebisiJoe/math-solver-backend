import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

@Injectable()
export class MathSolverService {
  private openai: OpenAI;
  private pinecone: Pinecone;

  constructor(private configService: ConfigService) { }

  onModuleInit() {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const pineconeApiKey = this.configService.get<string>('PINECONE_API_KEY');


    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set in the environment variables');
    }

    if (!pineconeApiKey) {
      throw new Error('PINECONE_API_KEY or PINECONE_ENVIRONMENT is not set in the environment variables');
    }

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    this.pinecone = new Pinecone({
      apiKey: pineconeApiKey,
    });
  }

  async solveQuestion(question: string): Promise<{ solution: string }> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Solve the following math problem step by step give me the answer using LaTeX: ${question}` }],
      max_tokens: 600, 
      temperature: 0.2, 
      top_p: 0.95, 
    });

    const solution = completion.choices[0].message.content.trim();

    const embedding = await this.createEmbedding(question);
    await this.storeQuestionAndSolution(question, solution, embedding);

    return { solution };
  }

  async getSimilarQuestions(question: string) {
    
    const embedding = await this.createEmbedding(question);
    const index = this.pinecone.index('math-solver');
    const queryResponse = await index.query({
      vector: embedding,
      topK: 5,
      includeMetadata: true,
    });
  
    return queryResponse.matches.map((match) => match.metadata);
  }

  private async createEmbedding(text: string): Promise<number[]> {
    const embeddingResponse = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return embeddingResponse.data[0].embedding;
  }

  private async storeQuestionAndSolution(question: string, solution: string, embedding: number[]) {
    const index = this.pinecone.index('math-solver');
    await index.upsert([
      {
        id: Date.now().toString(),
        values: embedding,
        metadata: { question, solution },
      },
    ]);
  }
}
