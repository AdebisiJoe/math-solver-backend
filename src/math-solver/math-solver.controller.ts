import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { MathSolverService } from './math-solver.service';

@Controller('math')
export class MathSolverController {

  constructor(private readonly mathSolverService: MathSolverService) {}

  @Post('solve')
  async solveQuestion(@Body('question') question: string) {
    return this.mathSolverService.solveQuestion(question);

  }

  @Post('similar')
  async getSimilarQuestions(@Body('question') question: string) {
    return await this.mathSolverService.getSimilarQuestions(question);
  }
}