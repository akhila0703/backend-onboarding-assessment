import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {

  @Get()
  check() {
    return {
      status: 'ok',
      message: 'Server running',
      timestamp: new Date().toISOString(),
    };
  }

}

