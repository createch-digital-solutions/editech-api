import { jest } from '@jest/globals';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import {
  TransformInterceptor,
  ApiResponse,
} from '../../src/common/interceptors/transform.interceptor.js';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  function createMockContext(requestId = 'req_test_123'): ExecutionContext {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ id: requestId }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should wrap standard object responses in Phase 15 success envelope', (done) => {
    const context = createMockContext('req_test_123');
    const handler: CallHandler = {
      handle: () => of({ message: 'Hello World' }),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      const resp = result as ApiResponse<{ message: string }>;
      expect(resp.success).toBe(true);
      expect(resp.data).toEqual({ message: 'Hello World' });
      expect(resp.meta.requestId).toBe('req_test_123');
      expect(resp.meta.timestamp).toBeDefined();
      done();
    });
  });

  it('should handle paginated response and place pagination at top level', (done) => {
    const context = createMockContext('req_page_456');
    const paginatedData = {
      data: [{ id: 'course_1' }],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };
    const handler: CallHandler = {
      handle: () => of(paginatedData),
    };

    interceptor.intercept(context, handler).subscribe((result) => {
      const resp = result as ApiResponse<Array<{ id: string }>>;
      expect(resp.success).toBe(true);
      expect(resp.data).toEqual([{ id: 'course_1' }]);
      expect(resp.pagination).toEqual(paginatedData.pagination);
      expect(resp.meta.requestId).toBe('req_page_456');
      done();
    });
  });
});
