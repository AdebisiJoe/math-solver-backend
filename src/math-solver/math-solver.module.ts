import { Module } from '@nestjs/common';
import { MathSolverService } from './math-solver.service';
import { MathSolverController } from './math-solver.controller';

@Module({
  controllers: [MathSolverController],
  providers: [MathSolverService]
})
export class MathSolverModule {}
