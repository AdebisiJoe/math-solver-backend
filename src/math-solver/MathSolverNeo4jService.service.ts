import { Injectable, HttpException, HttpStatus, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { Logger } from '@nestjs/common';

@Injectable()
export class MathSolverNeo4jService implements OnModuleInit, OnModuleDestroy {
  private openai: OpenAI;
  private neo4jDriver: Driver;
  private readonly logger = new Logger(MathSolverNeo4jService.name);

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    await this.initializeOpenAI();
    await this.initializeNeo4j();
    await this.createVectorIndex();
  }

  async onModuleDestroy() {
    await this.closeNeo4jConnection();
  }

  private async initializeOpenAI() {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new HttpException('OPENAI_API_KEY is not set', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.logger.log('OpenAI initialized');
  }

  private async initializeNeo4j() {
    const neo4jUri = this.configService.get<string>('NEO4J_URI');
    const neo4jUser = this.configService.get<string>('NEO4J_USER');
    const neo4jPassword = this.configService.get<string>('NEO4J_PASSWORD');

    if (!neo4jUri || !neo4jUser || !neo4jPassword) {
      throw new HttpException('Neo4j credentials are not set', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    this.neo4jDriver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
    this.logger.log('Neo4j connection initialized');
  }

  private async closeNeo4jConnection() {
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
      this.logger.log('Neo4j connection closed');
    }
  }

  private async createVectorIndex() {
    const session = this.neo4jDriver.session();
    try {
      await session.run(`
        CREATE VECTOR INDEX embeddingIndex IF NOT EXISTS
        FOR (q:Question)
        ON (q.embedding)
        OPTIONS {
          indexConfig: {
            \`vector.dimensions\`: 1536,
            \`vector.similarity_function\`: 'cosine'
          }
        }
      `);
      this.logger.log('Vector index created or already exists');
    } catch (error) {
      this.logger.error('Error creating vector index:', error);
    } finally {
      await session.close();
    }
  }

  async solveQuestion(question: string): Promise<{ solution: string, questionType: string }> {
    const session = this.neo4jDriver.session();
    try {
      const questionType = await this.getQuestionType(question);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Solve the following math problem step by step give me the answer using LaTeX: ${question}` }],
        max_tokens: 600,
        temperature: 0.2,
        top_p: 0.95,
      });

      const solution = completion.choices[0].message.content.trim();
      const embedding = await this.createEmbedding(question);

      await this.storeQuestionAndSolution(session, question, solution, questionType, embedding);

      this.logger.log(`Question solved: ${question}`);
      return { solution, questionType };
    } catch (error) {
      this.logger.error(`Failed to solve the question: ${error.message}`);
      throw new HttpException(`Failed to solve the question: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await session.close();
    }
  }

  async getSimilarQuestions(question: string) {
    const session = this.neo4jDriver.session();
    try {
      //const embedding = await this.createEmbedding(question);
  
      const result = await session.run(
        `
        MATCH (q:Question {question: $question})
        CALL db.index.vector.queryNodes('embeddingIndex', 5, q.embedding) 
        YIELD node, score
        RETURN node.question AS question, node.solution AS solution, score
        `,
        { question }
      );
  
      this.logger.log(`Retrieved similar questions for: ${question}`);
      return result.records.map(record => ({
        question: record.get('question'),
        solution: record.get('solution'),
        score: record.get('score')
      }));
    } catch (error) {
      this.logger.error(`Failed to retrieve similar questions: ${error.message}`);
      throw new HttpException(`Failed to retrieve similar questions: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await session.close();
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
      this.logger.error(`Failed to create embedding: ${error.message}`);
      throw new HttpException(`Failed to create embedding: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getQuestionType(question: string): Promise<string> {
    const predefinedTypes = [
      "algebra", "calculus", "geometry", "trigonometry", "statistics",
      "arithmetic", "number theory", "combinatorics", "probability", "linear algebra",
      "differential equations", "real analysis", "complex analysis", "topology",
      "discrete mathematics", "set theory", "mathematical logic", "numerical analysis",
      "optimization", "abstract algebra", "game theory", "graph theory", "cryptography",
      "measure theory", "functional analysis", "dynamical systems", "fractals", "fuzzy logic",
      "mathematical modeling", "network theory", "operations research", "queueing theory",
      "information theory", "control theory", "computational mathematics", "mathematical physics",
      "biomathematics", "financial mathematics", "actuarial science", "mathematical statistics",
      "stochastic processes", "quantum mechanics", "relativity", "fluid dynamics",
      "nonlinear dynamics", "chaos theory"
    ];
  
    const typePrompt = `Given the following math problem, identify its type from the predefined list (${predefinedTypes.join(', ')}): ${question}`;
  
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: typePrompt }],
        max_tokens: 1000,
        temperature: 1.0,
      });
  
      const questionType = completion.choices[0].message.content.trim().toLowerCase();
      if (predefinedTypes.includes(questionType)) {
        return questionType;
      } else {
        // Fallback type for unrecognized questions
        return "arithmetic";
      }
    } catch (error) {
      this.logger.error(`Failed to determine question type: ${error.message}`);
      throw new HttpException(`Failed to determine question type: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  

  private async storeQuestionAndSolution(session: Session, question: string, solution: string, questionType: string, embedding: number[]) {
    try {
      await session.run(
        `
        MERGE (qt:QuestionType {name: $questionType})
        CREATE (q:Question {question: $question, solution: $solution, embedding: $embedding})
        MERGE (q)-[:OF_TYPE]->(qt)
        `,
        { question, solution, questionType, embedding }
      );
      this.logger.log(`Stored question and solution: ${question}`);
    } catch (error) {
      this.logger.error(`Failed to store question and solution: ${error.message}`);
      throw new HttpException(`Failed to store question and solution: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}