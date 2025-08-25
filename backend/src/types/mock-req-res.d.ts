// backend\src\types\mock-req-res.d.ts
declare module 'mock-req-res' {
  export function mockRequest(params?: any): any;
  export function mockResponse(params?: any): any;
}