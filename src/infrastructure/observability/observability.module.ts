import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics/metrics.service';
import { StructuredLoggerService } from './logging/structured-logger.service';
import { METRICS_PORT, LOGGER_PORT } from '../../application/ports';

@Global()
@Module({
  providers: [
    MetricsService,
    {
      provide: METRICS_PORT,
      useExisting: MetricsService,
    },
    StructuredLoggerService,
    {
      provide: LOGGER_PORT,
      useExisting: StructuredLoggerService,
    },
  ],
  exports: [METRICS_PORT, LOGGER_PORT, MetricsService],
})
export class ObservabilityModule {}
