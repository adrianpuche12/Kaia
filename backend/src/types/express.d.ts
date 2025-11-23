// Type declarations for Express 5.x compatibility
declare module 'express' {
  import * as express from 'express-serve-static-core';

  export interface Request extends express.Request {}
  export interface Response extends express.Response {}
  export interface NextFunction extends express.NextFunction {}
  export interface Router extends express.Router {}
  export interface Application extends express.Application {}

  function e(): express.Express;

  namespace e {
    export const json: typeof express.json;
    export const urlencoded: typeof express.urlencoded;
    export const Router: typeof express.Router;
    export const static: typeof express.static;
  }

  export = e;
}
