declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: "development" | "production" | "test";
    PORT?: string;
    SECRET_KEY: string;
    MONGO_DB_URI: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_S3_BUCKET?: string;
    ORIGINS?: string;
    ALLOW_SUBDOMAINS?: string;
    [key: string]: string | undefined;
  }
}

export {};
