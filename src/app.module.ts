import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MathSolverModule } from './math-solver/math-solver.module';

@Module({
  imports: [MathSolverModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
