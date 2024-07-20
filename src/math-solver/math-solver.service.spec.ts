import { Test, TestingModule } from '@nestjs/testing';
import { MathSolverService } from './MathSolverPineconeService.service';

describe('MathSolverService', () => {
  let service: MathSolverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MathSolverService],
    }).compile();

    service = module.get<MathSolverService>(MathSolverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
