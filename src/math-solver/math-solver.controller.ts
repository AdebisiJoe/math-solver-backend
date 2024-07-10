import { Controller } from '@nestjs/common';
import { MathSolverService } from './math-solver.service';

@Controller('math-solver')
export class MathSolverController {
  constructor(private readonly mathSolverService: MathSolverService) {}
}
