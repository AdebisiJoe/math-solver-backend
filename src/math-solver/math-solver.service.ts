import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

@Injectable()
export class MathSolverService {
  private openai: OpenAI;
  private pinecone: Pinecone;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    const pineconeApiKey = this.configService.get<string>('PINECONE_API_KEY');

    if (!openaiApiKey) {
      throw new HttpException('OPENAI_API_KEY is not set in the environment variables', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!pineconeApiKey) {
      throw new HttpException('PINECONE_API_KEY is not set in the environment variables', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    this.pinecone = new Pinecone({
      apiKey: pineconeApiKey,
    });
  }

  async solveQuestion(question: string): Promise<{ solution: string }> {
    try {
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
    } catch (error) {
      throw new HttpException(`Failed to solve the question: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSimilarQuestions(question: string) {
    try {
      const embedding = await this.createEmbedding(question);
      const index = this.pinecone.index('math-solver');
      const queryResponse = await index.query({
        vector: embedding,
        topK: 5,
        includeMetadata: true,
      });
    
      return queryResponse.matches.map((match) => match.metadata);
    } catch (error) {
      throw new HttpException(`Failed to retrieve similar questions: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async createEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingResponse = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });

      return embeddingResponse.data[0].embedding;
    } catch (error) {
      throw new HttpException(`Failed to create embedding: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async storeQuestionAndSolution(question: string, solution: string, embedding: number[]) {
    try {
      const index = this.pinecone.index('math-solver');
      await index.upsert([
        {
          id: Date.now().toString(),
          values: embedding,
          metadata: { question, solution },
        },
      ]);
    } catch (error) {
      throw new HttpException(`Failed to store question and solution: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
