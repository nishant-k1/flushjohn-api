declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email?: string;
        fName?: string;
        lName?: string;
        role?: string;
        isActive?: boolean;
      };
      pagination?: {
        page: number;
        limit: number;
        skip: number;
      };
      productValidation?: {
        hasDiscrepancy: boolean;
        discrepancies: Array<{
          index: number;
          item: string;
          quantity: number;
          rate: number;
          frontendAmount: number;
          serverAmount: number;
          difference: number;
        }>;
        productCount: number;
        totalAmount: string;
      };
    }
  }
}

// Extend Express to allow route handlers to return Response
declare module "express-serve-static-core" {
  interface IRouter {
    use(...handlers: any[]): this;
    get<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
    post<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
    put<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
    delete<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
    patch<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
  }

  interface Application {
    use(...handlers: any[]): this;
    get<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
    post<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
    put<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
    delete<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
    patch<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
      path: any,
      ...handlers: any[]
    ): this;
  }
}

export {};
