import { Module } from '@nestjs/common';
import { MathSolverPineconeService } from './MathSolverPineconeService.service';
import { MathSolverNeo4jService } from './MathSolverNeo4jService.service';
import { MathSolverController } from './math-solver.controller';

@Module({
  controllers: [MathSolverController],
  providers: [
    MathSolverPineconeService,
    MathSolverNeo4jService
  ]
})
export class MathSolverModule { }
