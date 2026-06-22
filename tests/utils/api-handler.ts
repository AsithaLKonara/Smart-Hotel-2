import { NextRequest } from 'next/server';

export function createApiRequest(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  headers?: Record<string, string>
): Request {
  const url = `http://localhost:3000${path}`;
  
  const init: RequestInit = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new Request(url, init);
}

export function createNextRequest(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  headers?: Record<string, string>
): NextRequest {
  const url = `http://localhost:3000${path}`;
  
  const init: RequestInit = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init as any);
}
