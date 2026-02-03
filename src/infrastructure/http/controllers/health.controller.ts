import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'transaction-api',
    };
  }
}
