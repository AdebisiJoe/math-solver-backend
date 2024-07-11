import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MathSolverModule } from './math-solver/math-solver.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MathSolverModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
