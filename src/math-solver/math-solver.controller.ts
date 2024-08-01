import { Controller, Post, Body, Get } from '@nestjs/common';
import { MathSolverPineconeService } from './MathSolverPineconeService.service';
import { MathSolverNeo4jService } from './MathSolverNeo4jService.service';

@Controller('math')
export class MathSolverController {
  constructor(
    private readonly mathSolverPineconeService: MathSolverPineconeService,
    private readonly mathSolverNeo4jService: MathSolverNeo4jService
  ) { }

  @Post('solve')
  async solveQuestion(
    @Body('question') question: string,
    @Body('useNeo4j') useNeo4j: boolean
  ) {
    if (useNeo4j) {
      return this.mathSolverNeo4jService.solveQuestion(question);
    } else {
      return this.mathSolverPineconeService.solveQuestion(question);
    }
  }

  @Post('similar')
  async getSimilarQuestions(
    @Body('question') question: string,
    @Body('useNeo4j') useNeo4j: boolean
  ) {
    if (useNeo4j) {
      return await this.mathSolverNeo4jService.getSimilarQuestions(question);
    } else {
      return await this.mathSolverPineconeService.getSimilarQuestions(question);
    }
  }

  @Get('/converttoasci')
  async convertToAsciMath() {
    return await this.mathSolverNeo4jService.addASCIIMathProperties();
  }
}
