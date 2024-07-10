import { Test, TestingModule } from '@nestjs/testing';
import { MathSolverController } from './math-solver.controller';
import { MathSolverService } from './math-solver.service';

describe('MathSolverController', () => {
  let controller: MathSolverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MathSolverController],
      providers: [MathSolverService],
    }).compile();

    controller = module.get<MathSolverController>(MathSolverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
