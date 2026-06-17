
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model ModelProxyRequest
 * 
 */
export type ModelProxyRequest = $Result.DefaultSelection<Prisma.$ModelProxyRequestPayload>
/**
 * Model ModelProxyUsageAdjustment
 * 
 */
export type ModelProxyUsageAdjustment = $Result.DefaultSelection<Prisma.$ModelProxyUsageAdjustmentPayload>
/**
 * Model ModelProxyMessage
 * 
 */
export type ModelProxyMessage = $Result.DefaultSelection<Prisma.$ModelProxyMessagePayload>
/**
 * Model ModelProxyModel
 * 
 */
export type ModelProxyModel = $Result.DefaultSelection<Prisma.$ModelProxyModelPayload>
/**
 * Model ModelProxyCredential
 * 
 */
export type ModelProxyCredential = $Result.DefaultSelection<Prisma.$ModelProxyCredentialPayload>
/**
 * Model ModelProxyApiKey
 * 
 */
export type ModelProxyApiKey = $Result.DefaultSelection<Prisma.$ModelProxyApiKeyPayload>
/**
 * Model ModelProxySetting
 * 
 */
export type ModelProxySetting = $Result.DefaultSelection<Prisma.$ModelProxySettingPayload>
/**
 * Model ModelProxyAlias
 * 
 */
export type ModelProxyAlias = $Result.DefaultSelection<Prisma.$ModelProxyAliasPayload>
/**
 * Model ModelProxyImportJob
 * 
 */
export type ModelProxyImportJob = $Result.DefaultSelection<Prisma.$ModelProxyImportJobPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more ModelProxyRequests
 * const modelProxyRequests = await prisma.modelProxyRequest.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more ModelProxyRequests
   * const modelProxyRequests = await prisma.modelProxyRequest.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.modelProxyRequest`: Exposes CRUD operations for the **ModelProxyRequest** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxyRequests
    * const modelProxyRequests = await prisma.modelProxyRequest.findMany()
    * ```
    */
  get modelProxyRequest(): Prisma.ModelProxyRequestDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modelProxyUsageAdjustment`: Exposes CRUD operations for the **ModelProxyUsageAdjustment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxyUsageAdjustments
    * const modelProxyUsageAdjustments = await prisma.modelProxyUsageAdjustment.findMany()
    * ```
    */
  get modelProxyUsageAdjustment(): Prisma.ModelProxyUsageAdjustmentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modelProxyMessage`: Exposes CRUD operations for the **ModelProxyMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxyMessages
    * const modelProxyMessages = await prisma.modelProxyMessage.findMany()
    * ```
    */
  get modelProxyMessage(): Prisma.ModelProxyMessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modelProxyModel`: Exposes CRUD operations for the **ModelProxyModel** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxyModels
    * const modelProxyModels = await prisma.modelProxyModel.findMany()
    * ```
    */
  get modelProxyModel(): Prisma.ModelProxyModelDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modelProxyCredential`: Exposes CRUD operations for the **ModelProxyCredential** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxyCredentials
    * const modelProxyCredentials = await prisma.modelProxyCredential.findMany()
    * ```
    */
  get modelProxyCredential(): Prisma.ModelProxyCredentialDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modelProxyApiKey`: Exposes CRUD operations for the **ModelProxyApiKey** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxyApiKeys
    * const modelProxyApiKeys = await prisma.modelProxyApiKey.findMany()
    * ```
    */
  get modelProxyApiKey(): Prisma.ModelProxyApiKeyDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modelProxySetting`: Exposes CRUD operations for the **ModelProxySetting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxySettings
    * const modelProxySettings = await prisma.modelProxySetting.findMany()
    * ```
    */
  get modelProxySetting(): Prisma.ModelProxySettingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modelProxyAlias`: Exposes CRUD operations for the **ModelProxyAlias** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxyAliases
    * const modelProxyAliases = await prisma.modelProxyAlias.findMany()
    * ```
    */
  get modelProxyAlias(): Prisma.ModelProxyAliasDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.modelProxyImportJob`: Exposes CRUD operations for the **ModelProxyImportJob** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ModelProxyImportJobs
    * const modelProxyImportJobs = await prisma.modelProxyImportJob.findMany()
    * ```
    */
  get modelProxyImportJob(): Prisma.ModelProxyImportJobDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    ModelProxyRequest: 'ModelProxyRequest',
    ModelProxyUsageAdjustment: 'ModelProxyUsageAdjustment',
    ModelProxyMessage: 'ModelProxyMessage',
    ModelProxyModel: 'ModelProxyModel',
    ModelProxyCredential: 'ModelProxyCredential',
    ModelProxyApiKey: 'ModelProxyApiKey',
    ModelProxySetting: 'ModelProxySetting',
    ModelProxyAlias: 'ModelProxyAlias',
    ModelProxyImportJob: 'ModelProxyImportJob'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "modelProxyRequest" | "modelProxyUsageAdjustment" | "modelProxyMessage" | "modelProxyModel" | "modelProxyCredential" | "modelProxyApiKey" | "modelProxySetting" | "modelProxyAlias" | "modelProxyImportJob"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ModelProxyRequest: {
        payload: Prisma.$ModelProxyRequestPayload<ExtArgs>
        fields: Prisma.ModelProxyRequestFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxyRequestFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxyRequestFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>
          }
          findFirst: {
            args: Prisma.ModelProxyRequestFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxyRequestFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>
          }
          findMany: {
            args: Prisma.ModelProxyRequestFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>[]
          }
          create: {
            args: Prisma.ModelProxyRequestCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>
          }
          createMany: {
            args: Prisma.ModelProxyRequestCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxyRequestCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>[]
          }
          delete: {
            args: Prisma.ModelProxyRequestDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>
          }
          update: {
            args: Prisma.ModelProxyRequestUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>
          }
          deleteMany: {
            args: Prisma.ModelProxyRequestDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxyRequestUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxyRequestUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>[]
          }
          upsert: {
            args: Prisma.ModelProxyRequestUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyRequestPayload>
          }
          aggregate: {
            args: Prisma.ModelProxyRequestAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxyRequest>
          }
          groupBy: {
            args: Prisma.ModelProxyRequestGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyRequestGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxyRequestCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyRequestCountAggregateOutputType> | number
          }
        }
      }
      ModelProxyUsageAdjustment: {
        payload: Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>
        fields: Prisma.ModelProxyUsageAdjustmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxyUsageAdjustmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxyUsageAdjustmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>
          }
          findFirst: {
            args: Prisma.ModelProxyUsageAdjustmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxyUsageAdjustmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>
          }
          findMany: {
            args: Prisma.ModelProxyUsageAdjustmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>[]
          }
          create: {
            args: Prisma.ModelProxyUsageAdjustmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>
          }
          createMany: {
            args: Prisma.ModelProxyUsageAdjustmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxyUsageAdjustmentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>[]
          }
          delete: {
            args: Prisma.ModelProxyUsageAdjustmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>
          }
          update: {
            args: Prisma.ModelProxyUsageAdjustmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>
          }
          deleteMany: {
            args: Prisma.ModelProxyUsageAdjustmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxyUsageAdjustmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxyUsageAdjustmentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>[]
          }
          upsert: {
            args: Prisma.ModelProxyUsageAdjustmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyUsageAdjustmentPayload>
          }
          aggregate: {
            args: Prisma.ModelProxyUsageAdjustmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxyUsageAdjustment>
          }
          groupBy: {
            args: Prisma.ModelProxyUsageAdjustmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyUsageAdjustmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxyUsageAdjustmentCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyUsageAdjustmentCountAggregateOutputType> | number
          }
        }
      }
      ModelProxyMessage: {
        payload: Prisma.$ModelProxyMessagePayload<ExtArgs>
        fields: Prisma.ModelProxyMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxyMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxyMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>
          }
          findFirst: {
            args: Prisma.ModelProxyMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxyMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>
          }
          findMany: {
            args: Prisma.ModelProxyMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>[]
          }
          create: {
            args: Prisma.ModelProxyMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>
          }
          createMany: {
            args: Prisma.ModelProxyMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxyMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>[]
          }
          delete: {
            args: Prisma.ModelProxyMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>
          }
          update: {
            args: Prisma.ModelProxyMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>
          }
          deleteMany: {
            args: Prisma.ModelProxyMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxyMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxyMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>[]
          }
          upsert: {
            args: Prisma.ModelProxyMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyMessagePayload>
          }
          aggregate: {
            args: Prisma.ModelProxyMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxyMessage>
          }
          groupBy: {
            args: Prisma.ModelProxyMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxyMessageCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyMessageCountAggregateOutputType> | number
          }
        }
      }
      ModelProxyModel: {
        payload: Prisma.$ModelProxyModelPayload<ExtArgs>
        fields: Prisma.ModelProxyModelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxyModelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxyModelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>
          }
          findFirst: {
            args: Prisma.ModelProxyModelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxyModelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>
          }
          findMany: {
            args: Prisma.ModelProxyModelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>[]
          }
          create: {
            args: Prisma.ModelProxyModelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>
          }
          createMany: {
            args: Prisma.ModelProxyModelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxyModelCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>[]
          }
          delete: {
            args: Prisma.ModelProxyModelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>
          }
          update: {
            args: Prisma.ModelProxyModelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>
          }
          deleteMany: {
            args: Prisma.ModelProxyModelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxyModelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxyModelUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>[]
          }
          upsert: {
            args: Prisma.ModelProxyModelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyModelPayload>
          }
          aggregate: {
            args: Prisma.ModelProxyModelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxyModel>
          }
          groupBy: {
            args: Prisma.ModelProxyModelGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyModelGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxyModelCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyModelCountAggregateOutputType> | number
          }
        }
      }
      ModelProxyCredential: {
        payload: Prisma.$ModelProxyCredentialPayload<ExtArgs>
        fields: Prisma.ModelProxyCredentialFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxyCredentialFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxyCredentialFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>
          }
          findFirst: {
            args: Prisma.ModelProxyCredentialFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxyCredentialFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>
          }
          findMany: {
            args: Prisma.ModelProxyCredentialFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>[]
          }
          create: {
            args: Prisma.ModelProxyCredentialCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>
          }
          createMany: {
            args: Prisma.ModelProxyCredentialCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxyCredentialCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>[]
          }
          delete: {
            args: Prisma.ModelProxyCredentialDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>
          }
          update: {
            args: Prisma.ModelProxyCredentialUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>
          }
          deleteMany: {
            args: Prisma.ModelProxyCredentialDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxyCredentialUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxyCredentialUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>[]
          }
          upsert: {
            args: Prisma.ModelProxyCredentialUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyCredentialPayload>
          }
          aggregate: {
            args: Prisma.ModelProxyCredentialAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxyCredential>
          }
          groupBy: {
            args: Prisma.ModelProxyCredentialGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyCredentialGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxyCredentialCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyCredentialCountAggregateOutputType> | number
          }
        }
      }
      ModelProxyApiKey: {
        payload: Prisma.$ModelProxyApiKeyPayload<ExtArgs>
        fields: Prisma.ModelProxyApiKeyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxyApiKeyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxyApiKeyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>
          }
          findFirst: {
            args: Prisma.ModelProxyApiKeyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxyApiKeyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>
          }
          findMany: {
            args: Prisma.ModelProxyApiKeyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>[]
          }
          create: {
            args: Prisma.ModelProxyApiKeyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>
          }
          createMany: {
            args: Prisma.ModelProxyApiKeyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxyApiKeyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>[]
          }
          delete: {
            args: Prisma.ModelProxyApiKeyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>
          }
          update: {
            args: Prisma.ModelProxyApiKeyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>
          }
          deleteMany: {
            args: Prisma.ModelProxyApiKeyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxyApiKeyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxyApiKeyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>[]
          }
          upsert: {
            args: Prisma.ModelProxyApiKeyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyApiKeyPayload>
          }
          aggregate: {
            args: Prisma.ModelProxyApiKeyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxyApiKey>
          }
          groupBy: {
            args: Prisma.ModelProxyApiKeyGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyApiKeyGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxyApiKeyCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyApiKeyCountAggregateOutputType> | number
          }
        }
      }
      ModelProxySetting: {
        payload: Prisma.$ModelProxySettingPayload<ExtArgs>
        fields: Prisma.ModelProxySettingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxySettingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxySettingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>
          }
          findFirst: {
            args: Prisma.ModelProxySettingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxySettingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>
          }
          findMany: {
            args: Prisma.ModelProxySettingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>[]
          }
          create: {
            args: Prisma.ModelProxySettingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>
          }
          createMany: {
            args: Prisma.ModelProxySettingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxySettingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>[]
          }
          delete: {
            args: Prisma.ModelProxySettingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>
          }
          update: {
            args: Prisma.ModelProxySettingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>
          }
          deleteMany: {
            args: Prisma.ModelProxySettingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxySettingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxySettingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>[]
          }
          upsert: {
            args: Prisma.ModelProxySettingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxySettingPayload>
          }
          aggregate: {
            args: Prisma.ModelProxySettingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxySetting>
          }
          groupBy: {
            args: Prisma.ModelProxySettingGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxySettingGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxySettingCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxySettingCountAggregateOutputType> | number
          }
        }
      }
      ModelProxyAlias: {
        payload: Prisma.$ModelProxyAliasPayload<ExtArgs>
        fields: Prisma.ModelProxyAliasFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxyAliasFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxyAliasFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>
          }
          findFirst: {
            args: Prisma.ModelProxyAliasFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxyAliasFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>
          }
          findMany: {
            args: Prisma.ModelProxyAliasFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>[]
          }
          create: {
            args: Prisma.ModelProxyAliasCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>
          }
          createMany: {
            args: Prisma.ModelProxyAliasCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxyAliasCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>[]
          }
          delete: {
            args: Prisma.ModelProxyAliasDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>
          }
          update: {
            args: Prisma.ModelProxyAliasUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>
          }
          deleteMany: {
            args: Prisma.ModelProxyAliasDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxyAliasUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxyAliasUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>[]
          }
          upsert: {
            args: Prisma.ModelProxyAliasUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyAliasPayload>
          }
          aggregate: {
            args: Prisma.ModelProxyAliasAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxyAlias>
          }
          groupBy: {
            args: Prisma.ModelProxyAliasGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyAliasGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxyAliasCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyAliasCountAggregateOutputType> | number
          }
        }
      }
      ModelProxyImportJob: {
        payload: Prisma.$ModelProxyImportJobPayload<ExtArgs>
        fields: Prisma.ModelProxyImportJobFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelProxyImportJobFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelProxyImportJobFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>
          }
          findFirst: {
            args: Prisma.ModelProxyImportJobFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelProxyImportJobFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>
          }
          findMany: {
            args: Prisma.ModelProxyImportJobFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>[]
          }
          create: {
            args: Prisma.ModelProxyImportJobCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>
          }
          createMany: {
            args: Prisma.ModelProxyImportJobCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ModelProxyImportJobCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>[]
          }
          delete: {
            args: Prisma.ModelProxyImportJobDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>
          }
          update: {
            args: Prisma.ModelProxyImportJobUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>
          }
          deleteMany: {
            args: Prisma.ModelProxyImportJobDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelProxyImportJobUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ModelProxyImportJobUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>[]
          }
          upsert: {
            args: Prisma.ModelProxyImportJobUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelProxyImportJobPayload>
          }
          aggregate: {
            args: Prisma.ModelProxyImportJobAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModelProxyImportJob>
          }
          groupBy: {
            args: Prisma.ModelProxyImportJobGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyImportJobGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelProxyImportJobCountArgs<ExtArgs>
            result: $Utils.Optional<ModelProxyImportJobCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    modelProxyRequest?: ModelProxyRequestOmit
    modelProxyUsageAdjustment?: ModelProxyUsageAdjustmentOmit
    modelProxyMessage?: ModelProxyMessageOmit
    modelProxyModel?: ModelProxyModelOmit
    modelProxyCredential?: ModelProxyCredentialOmit
    modelProxyApiKey?: ModelProxyApiKeyOmit
    modelProxySetting?: ModelProxySettingOmit
    modelProxyAlias?: ModelProxyAliasOmit
    modelProxyImportJob?: ModelProxyImportJobOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ModelProxyRequestCountOutputType
   */

  export type ModelProxyRequestCountOutputType = {
    messages: number
    usageAdjustments: number
  }

  export type ModelProxyRequestCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | ModelProxyRequestCountOutputTypeCountMessagesArgs
    usageAdjustments?: boolean | ModelProxyRequestCountOutputTypeCountUsageAdjustmentsArgs
  }

  // Custom InputTypes
  /**
   * ModelProxyRequestCountOutputType without action
   */
  export type ModelProxyRequestCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequestCountOutputType
     */
    select?: ModelProxyRequestCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ModelProxyRequestCountOutputType without action
   */
  export type ModelProxyRequestCountOutputTypeCountMessagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyMessageWhereInput
  }

  /**
   * ModelProxyRequestCountOutputType without action
   */
  export type ModelProxyRequestCountOutputTypeCountUsageAdjustmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyUsageAdjustmentWhereInput
  }


  /**
   * Models
   */

  /**
   * Model ModelProxyRequest
   */

  export type AggregateModelProxyRequest = {
    _count: ModelProxyRequestCountAggregateOutputType | null
    _avg: ModelProxyRequestAvgAggregateOutputType | null
    _sum: ModelProxyRequestSumAggregateOutputType | null
    _min: ModelProxyRequestMinAggregateOutputType | null
    _max: ModelProxyRequestMaxAggregateOutputType | null
  }

  export type ModelProxyRequestAvgAggregateOutputType = {
    latencyMs: number | null
    ttftMs: number | null
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    cachedTokens: number | null
    reasoningTokens: number | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
    inputCost: number | null
    outputCost: number | null
    totalCost: number | null
    estimatedCostUsd: number | null
    errorStatusCode: number | null
  }

  export type ModelProxyRequestSumAggregateOutputType = {
    latencyMs: number | null
    ttftMs: number | null
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    cachedTokens: number | null
    reasoningTokens: number | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
    inputCost: number | null
    outputCost: number | null
    totalCost: number | null
    estimatedCostUsd: number | null
    errorStatusCode: number | null
  }

  export type ModelProxyRequestMinAggregateOutputType = {
    id: string | null
    upstreamRequestId: string | null
    model: string | null
    upstreamModel: string | null
    upstreamBaseUrl: string | null
    status: string | null
    startedAt: Date | null
    finishedAt: Date | null
    latencyMs: number | null
    ttftMs: number | null
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    cachedTokens: number | null
    reasoningTokens: number | null
    usageEstimated: boolean | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
    inputCost: number | null
    outputCost: number | null
    totalCost: number | null
    costEstimated: boolean | null
    estimatedCostUsd: number | null
    errorSummary: string | null
    errorType: string | null
    errorMessage: string | null
    errorStatusCode: number | null
    apiKeyAlias: string | null
    endUser: string | null
  }

  export type ModelProxyRequestMaxAggregateOutputType = {
    id: string | null
    upstreamRequestId: string | null
    model: string | null
    upstreamModel: string | null
    upstreamBaseUrl: string | null
    status: string | null
    startedAt: Date | null
    finishedAt: Date | null
    latencyMs: number | null
    ttftMs: number | null
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    cachedTokens: number | null
    reasoningTokens: number | null
    usageEstimated: boolean | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
    inputCost: number | null
    outputCost: number | null
    totalCost: number | null
    costEstimated: boolean | null
    estimatedCostUsd: number | null
    errorSummary: string | null
    errorType: string | null
    errorMessage: string | null
    errorStatusCode: number | null
    apiKeyAlias: string | null
    endUser: string | null
  }

  export type ModelProxyRequestCountAggregateOutputType = {
    id: number
    upstreamRequestId: number
    model: number
    upstreamModel: number
    upstreamBaseUrl: number
    status: number
    startedAt: number
    finishedAt: number
    latencyMs: number
    ttftMs: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cachedTokens: number
    reasoningTokens: number
    usageEstimated: number
    inputCostPerToken: number
    outputCostPerToken: number
    inputCost: number
    outputCost: number
    totalCost: number
    costEstimated: number
    estimatedCostUsd: number
    errorSummary: number
    errorType: number
    errorMessage: number
    errorStatusCode: number
    errorDetails: number
    requestBody: number
    responseBody: number
    responseHeaders: number
    apiKeyAlias: number
    endUser: number
    _all: number
  }


  export type ModelProxyRequestAvgAggregateInputType = {
    latencyMs?: true
    ttftMs?: true
    inputTokens?: true
    outputTokens?: true
    totalTokens?: true
    cachedTokens?: true
    reasoningTokens?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
    inputCost?: true
    outputCost?: true
    totalCost?: true
    estimatedCostUsd?: true
    errorStatusCode?: true
  }

  export type ModelProxyRequestSumAggregateInputType = {
    latencyMs?: true
    ttftMs?: true
    inputTokens?: true
    outputTokens?: true
    totalTokens?: true
    cachedTokens?: true
    reasoningTokens?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
    inputCost?: true
    outputCost?: true
    totalCost?: true
    estimatedCostUsd?: true
    errorStatusCode?: true
  }

  export type ModelProxyRequestMinAggregateInputType = {
    id?: true
    upstreamRequestId?: true
    model?: true
    upstreamModel?: true
    upstreamBaseUrl?: true
    status?: true
    startedAt?: true
    finishedAt?: true
    latencyMs?: true
    ttftMs?: true
    inputTokens?: true
    outputTokens?: true
    totalTokens?: true
    cachedTokens?: true
    reasoningTokens?: true
    usageEstimated?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
    inputCost?: true
    outputCost?: true
    totalCost?: true
    costEstimated?: true
    estimatedCostUsd?: true
    errorSummary?: true
    errorType?: true
    errorMessage?: true
    errorStatusCode?: true
    apiKeyAlias?: true
    endUser?: true
  }

  export type ModelProxyRequestMaxAggregateInputType = {
    id?: true
    upstreamRequestId?: true
    model?: true
    upstreamModel?: true
    upstreamBaseUrl?: true
    status?: true
    startedAt?: true
    finishedAt?: true
    latencyMs?: true
    ttftMs?: true
    inputTokens?: true
    outputTokens?: true
    totalTokens?: true
    cachedTokens?: true
    reasoningTokens?: true
    usageEstimated?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
    inputCost?: true
    outputCost?: true
    totalCost?: true
    costEstimated?: true
    estimatedCostUsd?: true
    errorSummary?: true
    errorType?: true
    errorMessage?: true
    errorStatusCode?: true
    apiKeyAlias?: true
    endUser?: true
  }

  export type ModelProxyRequestCountAggregateInputType = {
    id?: true
    upstreamRequestId?: true
    model?: true
    upstreamModel?: true
    upstreamBaseUrl?: true
    status?: true
    startedAt?: true
    finishedAt?: true
    latencyMs?: true
    ttftMs?: true
    inputTokens?: true
    outputTokens?: true
    totalTokens?: true
    cachedTokens?: true
    reasoningTokens?: true
    usageEstimated?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
    inputCost?: true
    outputCost?: true
    totalCost?: true
    costEstimated?: true
    estimatedCostUsd?: true
    errorSummary?: true
    errorType?: true
    errorMessage?: true
    errorStatusCode?: true
    errorDetails?: true
    requestBody?: true
    responseBody?: true
    responseHeaders?: true
    apiKeyAlias?: true
    endUser?: true
    _all?: true
  }

  export type ModelProxyRequestAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyRequest to aggregate.
     */
    where?: ModelProxyRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyRequests to fetch.
     */
    orderBy?: ModelProxyRequestOrderByWithRelationInput | ModelProxyRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxyRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxyRequests
    **/
    _count?: true | ModelProxyRequestCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ModelProxyRequestAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ModelProxyRequestSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxyRequestMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxyRequestMaxAggregateInputType
  }

  export type GetModelProxyRequestAggregateType<T extends ModelProxyRequestAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxyRequest]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxyRequest[P]>
      : GetScalarType<T[P], AggregateModelProxyRequest[P]>
  }




  export type ModelProxyRequestGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyRequestWhereInput
    orderBy?: ModelProxyRequestOrderByWithAggregationInput | ModelProxyRequestOrderByWithAggregationInput[]
    by: ModelProxyRequestScalarFieldEnum[] | ModelProxyRequestScalarFieldEnum
    having?: ModelProxyRequestScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxyRequestCountAggregateInputType | true
    _avg?: ModelProxyRequestAvgAggregateInputType
    _sum?: ModelProxyRequestSumAggregateInputType
    _min?: ModelProxyRequestMinAggregateInputType
    _max?: ModelProxyRequestMaxAggregateInputType
  }

  export type ModelProxyRequestGroupByOutputType = {
    id: string
    upstreamRequestId: string | null
    model: string
    upstreamModel: string
    upstreamBaseUrl: string
    status: string
    startedAt: Date
    finishedAt: Date | null
    latencyMs: number | null
    ttftMs: number | null
    inputTokens: number | null
    outputTokens: number | null
    totalTokens: number | null
    cachedTokens: number | null
    reasoningTokens: number | null
    usageEstimated: boolean | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
    inputCost: number | null
    outputCost: number | null
    totalCost: number | null
    costEstimated: boolean | null
    estimatedCostUsd: number | null
    errorSummary: string | null
    errorType: string | null
    errorMessage: string | null
    errorStatusCode: number | null
    errorDetails: JsonValue | null
    requestBody: JsonValue | null
    responseBody: JsonValue | null
    responseHeaders: JsonValue | null
    apiKeyAlias: string | null
    endUser: string | null
    _count: ModelProxyRequestCountAggregateOutputType | null
    _avg: ModelProxyRequestAvgAggregateOutputType | null
    _sum: ModelProxyRequestSumAggregateOutputType | null
    _min: ModelProxyRequestMinAggregateOutputType | null
    _max: ModelProxyRequestMaxAggregateOutputType | null
  }

  type GetModelProxyRequestGroupByPayload<T extends ModelProxyRequestGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxyRequestGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxyRequestGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxyRequestGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxyRequestGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxyRequestSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    upstreamRequestId?: boolean
    model?: boolean
    upstreamModel?: boolean
    upstreamBaseUrl?: boolean
    status?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    latencyMs?: boolean
    ttftMs?: boolean
    inputTokens?: boolean
    outputTokens?: boolean
    totalTokens?: boolean
    cachedTokens?: boolean
    reasoningTokens?: boolean
    usageEstimated?: boolean
    inputCostPerToken?: boolean
    outputCostPerToken?: boolean
    inputCost?: boolean
    outputCost?: boolean
    totalCost?: boolean
    costEstimated?: boolean
    estimatedCostUsd?: boolean
    errorSummary?: boolean
    errorType?: boolean
    errorMessage?: boolean
    errorStatusCode?: boolean
    errorDetails?: boolean
    requestBody?: boolean
    responseBody?: boolean
    responseHeaders?: boolean
    apiKeyAlias?: boolean
    endUser?: boolean
    messages?: boolean | ModelProxyRequest$messagesArgs<ExtArgs>
    usageAdjustments?: boolean | ModelProxyRequest$usageAdjustmentsArgs<ExtArgs>
    _count?: boolean | ModelProxyRequestCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["modelProxyRequest"]>

  export type ModelProxyRequestSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    upstreamRequestId?: boolean
    model?: boolean
    upstreamModel?: boolean
    upstreamBaseUrl?: boolean
    status?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    latencyMs?: boolean
    ttftMs?: boolean
    inputTokens?: boolean
    outputTokens?: boolean
    totalTokens?: boolean
    cachedTokens?: boolean
    reasoningTokens?: boolean
    usageEstimated?: boolean
    inputCostPerToken?: boolean
    outputCostPerToken?: boolean
    inputCost?: boolean
    outputCost?: boolean
    totalCost?: boolean
    costEstimated?: boolean
    estimatedCostUsd?: boolean
    errorSummary?: boolean
    errorType?: boolean
    errorMessage?: boolean
    errorStatusCode?: boolean
    errorDetails?: boolean
    requestBody?: boolean
    responseBody?: boolean
    responseHeaders?: boolean
    apiKeyAlias?: boolean
    endUser?: boolean
  }, ExtArgs["result"]["modelProxyRequest"]>

  export type ModelProxyRequestSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    upstreamRequestId?: boolean
    model?: boolean
    upstreamModel?: boolean
    upstreamBaseUrl?: boolean
    status?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    latencyMs?: boolean
    ttftMs?: boolean
    inputTokens?: boolean
    outputTokens?: boolean
    totalTokens?: boolean
    cachedTokens?: boolean
    reasoningTokens?: boolean
    usageEstimated?: boolean
    inputCostPerToken?: boolean
    outputCostPerToken?: boolean
    inputCost?: boolean
    outputCost?: boolean
    totalCost?: boolean
    costEstimated?: boolean
    estimatedCostUsd?: boolean
    errorSummary?: boolean
    errorType?: boolean
    errorMessage?: boolean
    errorStatusCode?: boolean
    errorDetails?: boolean
    requestBody?: boolean
    responseBody?: boolean
    responseHeaders?: boolean
    apiKeyAlias?: boolean
    endUser?: boolean
  }, ExtArgs["result"]["modelProxyRequest"]>

  export type ModelProxyRequestSelectScalar = {
    id?: boolean
    upstreamRequestId?: boolean
    model?: boolean
    upstreamModel?: boolean
    upstreamBaseUrl?: boolean
    status?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    latencyMs?: boolean
    ttftMs?: boolean
    inputTokens?: boolean
    outputTokens?: boolean
    totalTokens?: boolean
    cachedTokens?: boolean
    reasoningTokens?: boolean
    usageEstimated?: boolean
    inputCostPerToken?: boolean
    outputCostPerToken?: boolean
    inputCost?: boolean
    outputCost?: boolean
    totalCost?: boolean
    costEstimated?: boolean
    estimatedCostUsd?: boolean
    errorSummary?: boolean
    errorType?: boolean
    errorMessage?: boolean
    errorStatusCode?: boolean
    errorDetails?: boolean
    requestBody?: boolean
    responseBody?: boolean
    responseHeaders?: boolean
    apiKeyAlias?: boolean
    endUser?: boolean
  }

  export type ModelProxyRequestOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "upstreamRequestId" | "model" | "upstreamModel" | "upstreamBaseUrl" | "status" | "startedAt" | "finishedAt" | "latencyMs" | "ttftMs" | "inputTokens" | "outputTokens" | "totalTokens" | "cachedTokens" | "reasoningTokens" | "usageEstimated" | "inputCostPerToken" | "outputCostPerToken" | "inputCost" | "outputCost" | "totalCost" | "costEstimated" | "estimatedCostUsd" | "errorSummary" | "errorType" | "errorMessage" | "errorStatusCode" | "errorDetails" | "requestBody" | "responseBody" | "responseHeaders" | "apiKeyAlias" | "endUser", ExtArgs["result"]["modelProxyRequest"]>
  export type ModelProxyRequestInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    messages?: boolean | ModelProxyRequest$messagesArgs<ExtArgs>
    usageAdjustments?: boolean | ModelProxyRequest$usageAdjustmentsArgs<ExtArgs>
    _count?: boolean | ModelProxyRequestCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ModelProxyRequestIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ModelProxyRequestIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ModelProxyRequestPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxyRequest"
    objects: {
      messages: Prisma.$ModelProxyMessagePayload<ExtArgs>[]
      usageAdjustments: Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      upstreamRequestId: string | null
      model: string
      upstreamModel: string
      upstreamBaseUrl: string
      status: string
      startedAt: Date
      finishedAt: Date | null
      latencyMs: number | null
      ttftMs: number | null
      inputTokens: number | null
      outputTokens: number | null
      totalTokens: number | null
      cachedTokens: number | null
      reasoningTokens: number | null
      usageEstimated: boolean | null
      inputCostPerToken: number | null
      outputCostPerToken: number | null
      inputCost: number | null
      outputCost: number | null
      totalCost: number | null
      costEstimated: boolean | null
      estimatedCostUsd: number | null
      errorSummary: string | null
      errorType: string | null
      errorMessage: string | null
      errorStatusCode: number | null
      errorDetails: Prisma.JsonValue | null
      requestBody: Prisma.JsonValue | null
      responseBody: Prisma.JsonValue | null
      responseHeaders: Prisma.JsonValue | null
      apiKeyAlias: string | null
      endUser: string | null
    }, ExtArgs["result"]["modelProxyRequest"]>
    composites: {}
  }

  type ModelProxyRequestGetPayload<S extends boolean | null | undefined | ModelProxyRequestDefaultArgs> = $Result.GetResult<Prisma.$ModelProxyRequestPayload, S>

  type ModelProxyRequestCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxyRequestFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxyRequestCountAggregateInputType | true
    }

  export interface ModelProxyRequestDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxyRequest'], meta: { name: 'ModelProxyRequest' } }
    /**
     * Find zero or one ModelProxyRequest that matches the filter.
     * @param {ModelProxyRequestFindUniqueArgs} args - Arguments to find a ModelProxyRequest
     * @example
     * // Get one ModelProxyRequest
     * const modelProxyRequest = await prisma.modelProxyRequest.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxyRequestFindUniqueArgs>(args: SelectSubset<T, ModelProxyRequestFindUniqueArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxyRequest that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxyRequestFindUniqueOrThrowArgs} args - Arguments to find a ModelProxyRequest
     * @example
     * // Get one ModelProxyRequest
     * const modelProxyRequest = await prisma.modelProxyRequest.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxyRequestFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxyRequestFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyRequest that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyRequestFindFirstArgs} args - Arguments to find a ModelProxyRequest
     * @example
     * // Get one ModelProxyRequest
     * const modelProxyRequest = await prisma.modelProxyRequest.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxyRequestFindFirstArgs>(args?: SelectSubset<T, ModelProxyRequestFindFirstArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyRequest that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyRequestFindFirstOrThrowArgs} args - Arguments to find a ModelProxyRequest
     * @example
     * // Get one ModelProxyRequest
     * const modelProxyRequest = await prisma.modelProxyRequest.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxyRequestFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxyRequestFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxyRequests that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyRequestFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxyRequests
     * const modelProxyRequests = await prisma.modelProxyRequest.findMany()
     * 
     * // Get first 10 ModelProxyRequests
     * const modelProxyRequests = await prisma.modelProxyRequest.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxyRequestWithIdOnly = await prisma.modelProxyRequest.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxyRequestFindManyArgs>(args?: SelectSubset<T, ModelProxyRequestFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxyRequest.
     * @param {ModelProxyRequestCreateArgs} args - Arguments to create a ModelProxyRequest.
     * @example
     * // Create one ModelProxyRequest
     * const ModelProxyRequest = await prisma.modelProxyRequest.create({
     *   data: {
     *     // ... data to create a ModelProxyRequest
     *   }
     * })
     * 
     */
    create<T extends ModelProxyRequestCreateArgs>(args: SelectSubset<T, ModelProxyRequestCreateArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxyRequests.
     * @param {ModelProxyRequestCreateManyArgs} args - Arguments to create many ModelProxyRequests.
     * @example
     * // Create many ModelProxyRequests
     * const modelProxyRequest = await prisma.modelProxyRequest.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxyRequestCreateManyArgs>(args?: SelectSubset<T, ModelProxyRequestCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxyRequests and returns the data saved in the database.
     * @param {ModelProxyRequestCreateManyAndReturnArgs} args - Arguments to create many ModelProxyRequests.
     * @example
     * // Create many ModelProxyRequests
     * const modelProxyRequest = await prisma.modelProxyRequest.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxyRequests and only return the `id`
     * const modelProxyRequestWithIdOnly = await prisma.modelProxyRequest.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxyRequestCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxyRequestCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxyRequest.
     * @param {ModelProxyRequestDeleteArgs} args - Arguments to delete one ModelProxyRequest.
     * @example
     * // Delete one ModelProxyRequest
     * const ModelProxyRequest = await prisma.modelProxyRequest.delete({
     *   where: {
     *     // ... filter to delete one ModelProxyRequest
     *   }
     * })
     * 
     */
    delete<T extends ModelProxyRequestDeleteArgs>(args: SelectSubset<T, ModelProxyRequestDeleteArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxyRequest.
     * @param {ModelProxyRequestUpdateArgs} args - Arguments to update one ModelProxyRequest.
     * @example
     * // Update one ModelProxyRequest
     * const modelProxyRequest = await prisma.modelProxyRequest.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxyRequestUpdateArgs>(args: SelectSubset<T, ModelProxyRequestUpdateArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxyRequests.
     * @param {ModelProxyRequestDeleteManyArgs} args - Arguments to filter ModelProxyRequests to delete.
     * @example
     * // Delete a few ModelProxyRequests
     * const { count } = await prisma.modelProxyRequest.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxyRequestDeleteManyArgs>(args?: SelectSubset<T, ModelProxyRequestDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyRequestUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxyRequests
     * const modelProxyRequest = await prisma.modelProxyRequest.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxyRequestUpdateManyArgs>(args: SelectSubset<T, ModelProxyRequestUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyRequests and returns the data updated in the database.
     * @param {ModelProxyRequestUpdateManyAndReturnArgs} args - Arguments to update many ModelProxyRequests.
     * @example
     * // Update many ModelProxyRequests
     * const modelProxyRequest = await prisma.modelProxyRequest.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxyRequests and only return the `id`
     * const modelProxyRequestWithIdOnly = await prisma.modelProxyRequest.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxyRequestUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxyRequestUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxyRequest.
     * @param {ModelProxyRequestUpsertArgs} args - Arguments to update or create a ModelProxyRequest.
     * @example
     * // Update or create a ModelProxyRequest
     * const modelProxyRequest = await prisma.modelProxyRequest.upsert({
     *   create: {
     *     // ... data to create a ModelProxyRequest
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxyRequest we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxyRequestUpsertArgs>(args: SelectSubset<T, ModelProxyRequestUpsertArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxyRequests.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyRequestCountArgs} args - Arguments to filter ModelProxyRequests to count.
     * @example
     * // Count the number of ModelProxyRequests
     * const count = await prisma.modelProxyRequest.count({
     *   where: {
     *     // ... the filter for the ModelProxyRequests we want to count
     *   }
     * })
    **/
    count<T extends ModelProxyRequestCountArgs>(
      args?: Subset<T, ModelProxyRequestCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxyRequestCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxyRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyRequestAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxyRequestAggregateArgs>(args: Subset<T, ModelProxyRequestAggregateArgs>): Prisma.PrismaPromise<GetModelProxyRequestAggregateType<T>>

    /**
     * Group by ModelProxyRequest.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyRequestGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxyRequestGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxyRequestGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxyRequestGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxyRequestGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxyRequestGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxyRequest model
   */
  readonly fields: ModelProxyRequestFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxyRequest.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxyRequestClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    messages<T extends ModelProxyRequest$messagesArgs<ExtArgs> = {}>(args?: Subset<T, ModelProxyRequest$messagesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    usageAdjustments<T extends ModelProxyRequest$usageAdjustmentsArgs<ExtArgs> = {}>(args?: Subset<T, ModelProxyRequest$usageAdjustmentsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxyRequest model
   */
  interface ModelProxyRequestFieldRefs {
    readonly id: FieldRef<"ModelProxyRequest", 'String'>
    readonly upstreamRequestId: FieldRef<"ModelProxyRequest", 'String'>
    readonly model: FieldRef<"ModelProxyRequest", 'String'>
    readonly upstreamModel: FieldRef<"ModelProxyRequest", 'String'>
    readonly upstreamBaseUrl: FieldRef<"ModelProxyRequest", 'String'>
    readonly status: FieldRef<"ModelProxyRequest", 'String'>
    readonly startedAt: FieldRef<"ModelProxyRequest", 'DateTime'>
    readonly finishedAt: FieldRef<"ModelProxyRequest", 'DateTime'>
    readonly latencyMs: FieldRef<"ModelProxyRequest", 'Int'>
    readonly ttftMs: FieldRef<"ModelProxyRequest", 'Int'>
    readonly inputTokens: FieldRef<"ModelProxyRequest", 'Int'>
    readonly outputTokens: FieldRef<"ModelProxyRequest", 'Int'>
    readonly totalTokens: FieldRef<"ModelProxyRequest", 'Int'>
    readonly cachedTokens: FieldRef<"ModelProxyRequest", 'Int'>
    readonly reasoningTokens: FieldRef<"ModelProxyRequest", 'Int'>
    readonly usageEstimated: FieldRef<"ModelProxyRequest", 'Boolean'>
    readonly inputCostPerToken: FieldRef<"ModelProxyRequest", 'Float'>
    readonly outputCostPerToken: FieldRef<"ModelProxyRequest", 'Float'>
    readonly inputCost: FieldRef<"ModelProxyRequest", 'Float'>
    readonly outputCost: FieldRef<"ModelProxyRequest", 'Float'>
    readonly totalCost: FieldRef<"ModelProxyRequest", 'Float'>
    readonly costEstimated: FieldRef<"ModelProxyRequest", 'Boolean'>
    readonly estimatedCostUsd: FieldRef<"ModelProxyRequest", 'Float'>
    readonly errorSummary: FieldRef<"ModelProxyRequest", 'String'>
    readonly errorType: FieldRef<"ModelProxyRequest", 'String'>
    readonly errorMessage: FieldRef<"ModelProxyRequest", 'String'>
    readonly errorStatusCode: FieldRef<"ModelProxyRequest", 'Int'>
    readonly errorDetails: FieldRef<"ModelProxyRequest", 'Json'>
    readonly requestBody: FieldRef<"ModelProxyRequest", 'Json'>
    readonly responseBody: FieldRef<"ModelProxyRequest", 'Json'>
    readonly responseHeaders: FieldRef<"ModelProxyRequest", 'Json'>
    readonly apiKeyAlias: FieldRef<"ModelProxyRequest", 'String'>
    readonly endUser: FieldRef<"ModelProxyRequest", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxyRequest findUnique
   */
  export type ModelProxyRequestFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyRequest to fetch.
     */
    where: ModelProxyRequestWhereUniqueInput
  }

  /**
   * ModelProxyRequest findUniqueOrThrow
   */
  export type ModelProxyRequestFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyRequest to fetch.
     */
    where: ModelProxyRequestWhereUniqueInput
  }

  /**
   * ModelProxyRequest findFirst
   */
  export type ModelProxyRequestFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyRequest to fetch.
     */
    where?: ModelProxyRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyRequests to fetch.
     */
    orderBy?: ModelProxyRequestOrderByWithRelationInput | ModelProxyRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyRequests.
     */
    cursor?: ModelProxyRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyRequests.
     */
    distinct?: ModelProxyRequestScalarFieldEnum | ModelProxyRequestScalarFieldEnum[]
  }

  /**
   * ModelProxyRequest findFirstOrThrow
   */
  export type ModelProxyRequestFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyRequest to fetch.
     */
    where?: ModelProxyRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyRequests to fetch.
     */
    orderBy?: ModelProxyRequestOrderByWithRelationInput | ModelProxyRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyRequests.
     */
    cursor?: ModelProxyRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyRequests.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyRequests.
     */
    distinct?: ModelProxyRequestScalarFieldEnum | ModelProxyRequestScalarFieldEnum[]
  }

  /**
   * ModelProxyRequest findMany
   */
  export type ModelProxyRequestFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyRequests to fetch.
     */
    where?: ModelProxyRequestWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyRequests to fetch.
     */
    orderBy?: ModelProxyRequestOrderByWithRelationInput | ModelProxyRequestOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxyRequests.
     */
    cursor?: ModelProxyRequestWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyRequests from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyRequests.
     */
    skip?: number
    distinct?: ModelProxyRequestScalarFieldEnum | ModelProxyRequestScalarFieldEnum[]
  }

  /**
   * ModelProxyRequest create
   */
  export type ModelProxyRequestCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * The data needed to create a ModelProxyRequest.
     */
    data: XOR<ModelProxyRequestCreateInput, ModelProxyRequestUncheckedCreateInput>
  }

  /**
   * ModelProxyRequest createMany
   */
  export type ModelProxyRequestCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxyRequests.
     */
    data: ModelProxyRequestCreateManyInput | ModelProxyRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyRequest createManyAndReturn
   */
  export type ModelProxyRequestCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxyRequests.
     */
    data: ModelProxyRequestCreateManyInput | ModelProxyRequestCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyRequest update
   */
  export type ModelProxyRequestUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * The data needed to update a ModelProxyRequest.
     */
    data: XOR<ModelProxyRequestUpdateInput, ModelProxyRequestUncheckedUpdateInput>
    /**
     * Choose, which ModelProxyRequest to update.
     */
    where: ModelProxyRequestWhereUniqueInput
  }

  /**
   * ModelProxyRequest updateMany
   */
  export type ModelProxyRequestUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxyRequests.
     */
    data: XOR<ModelProxyRequestUpdateManyMutationInput, ModelProxyRequestUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyRequests to update
     */
    where?: ModelProxyRequestWhereInput
    /**
     * Limit how many ModelProxyRequests to update.
     */
    limit?: number
  }

  /**
   * ModelProxyRequest updateManyAndReturn
   */
  export type ModelProxyRequestUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxyRequests.
     */
    data: XOR<ModelProxyRequestUpdateManyMutationInput, ModelProxyRequestUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyRequests to update
     */
    where?: ModelProxyRequestWhereInput
    /**
     * Limit how many ModelProxyRequests to update.
     */
    limit?: number
  }

  /**
   * ModelProxyRequest upsert
   */
  export type ModelProxyRequestUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * The filter to search for the ModelProxyRequest to update in case it exists.
     */
    where: ModelProxyRequestWhereUniqueInput
    /**
     * In case the ModelProxyRequest found by the `where` argument doesn't exist, create a new ModelProxyRequest with this data.
     */
    create: XOR<ModelProxyRequestCreateInput, ModelProxyRequestUncheckedCreateInput>
    /**
     * In case the ModelProxyRequest was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxyRequestUpdateInput, ModelProxyRequestUncheckedUpdateInput>
  }

  /**
   * ModelProxyRequest delete
   */
  export type ModelProxyRequestDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
    /**
     * Filter which ModelProxyRequest to delete.
     */
    where: ModelProxyRequestWhereUniqueInput
  }

  /**
   * ModelProxyRequest deleteMany
   */
  export type ModelProxyRequestDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyRequests to delete
     */
    where?: ModelProxyRequestWhereInput
    /**
     * Limit how many ModelProxyRequests to delete.
     */
    limit?: number
  }

  /**
   * ModelProxyRequest.messages
   */
  export type ModelProxyRequest$messagesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    where?: ModelProxyMessageWhereInput
    orderBy?: ModelProxyMessageOrderByWithRelationInput | ModelProxyMessageOrderByWithRelationInput[]
    cursor?: ModelProxyMessageWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ModelProxyMessageScalarFieldEnum | ModelProxyMessageScalarFieldEnum[]
  }

  /**
   * ModelProxyRequest.usageAdjustments
   */
  export type ModelProxyRequest$usageAdjustmentsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    where?: ModelProxyUsageAdjustmentWhereInput
    orderBy?: ModelProxyUsageAdjustmentOrderByWithRelationInput | ModelProxyUsageAdjustmentOrderByWithRelationInput[]
    cursor?: ModelProxyUsageAdjustmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ModelProxyUsageAdjustmentScalarFieldEnum | ModelProxyUsageAdjustmentScalarFieldEnum[]
  }

  /**
   * ModelProxyRequest without action
   */
  export type ModelProxyRequestDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyRequest
     */
    select?: ModelProxyRequestSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyRequest
     */
    omit?: ModelProxyRequestOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyRequestInclude<ExtArgs> | null
  }


  /**
   * Model ModelProxyUsageAdjustment
   */

  export type AggregateModelProxyUsageAdjustment = {
    _count: ModelProxyUsageAdjustmentCountAggregateOutputType | null
    _avg: ModelProxyUsageAdjustmentAvgAggregateOutputType | null
    _sum: ModelProxyUsageAdjustmentSumAggregateOutputType | null
    _min: ModelProxyUsageAdjustmentMinAggregateOutputType | null
    _max: ModelProxyUsageAdjustmentMaxAggregateOutputType | null
  }

  export type ModelProxyUsageAdjustmentAvgAggregateOutputType = {
    promptTokensDelta: number | null
    completionTokensDelta: number | null
    totalCostDelta: number | null
  }

  export type ModelProxyUsageAdjustmentSumAggregateOutputType = {
    promptTokensDelta: number | null
    completionTokensDelta: number | null
    totalCostDelta: number | null
  }

  export type ModelProxyUsageAdjustmentMinAggregateOutputType = {
    id: string | null
    requestId: string | null
    reason: string | null
    promptTokensDelta: number | null
    completionTokensDelta: number | null
    totalCostDelta: number | null
    note: string | null
    createdAt: Date | null
  }

  export type ModelProxyUsageAdjustmentMaxAggregateOutputType = {
    id: string | null
    requestId: string | null
    reason: string | null
    promptTokensDelta: number | null
    completionTokensDelta: number | null
    totalCostDelta: number | null
    note: string | null
    createdAt: Date | null
  }

  export type ModelProxyUsageAdjustmentCountAggregateOutputType = {
    id: number
    requestId: number
    reason: number
    promptTokensDelta: number
    completionTokensDelta: number
    totalCostDelta: number
    note: number
    createdAt: number
    _all: number
  }


  export type ModelProxyUsageAdjustmentAvgAggregateInputType = {
    promptTokensDelta?: true
    completionTokensDelta?: true
    totalCostDelta?: true
  }

  export type ModelProxyUsageAdjustmentSumAggregateInputType = {
    promptTokensDelta?: true
    completionTokensDelta?: true
    totalCostDelta?: true
  }

  export type ModelProxyUsageAdjustmentMinAggregateInputType = {
    id?: true
    requestId?: true
    reason?: true
    promptTokensDelta?: true
    completionTokensDelta?: true
    totalCostDelta?: true
    note?: true
    createdAt?: true
  }

  export type ModelProxyUsageAdjustmentMaxAggregateInputType = {
    id?: true
    requestId?: true
    reason?: true
    promptTokensDelta?: true
    completionTokensDelta?: true
    totalCostDelta?: true
    note?: true
    createdAt?: true
  }

  export type ModelProxyUsageAdjustmentCountAggregateInputType = {
    id?: true
    requestId?: true
    reason?: true
    promptTokensDelta?: true
    completionTokensDelta?: true
    totalCostDelta?: true
    note?: true
    createdAt?: true
    _all?: true
  }

  export type ModelProxyUsageAdjustmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyUsageAdjustment to aggregate.
     */
    where?: ModelProxyUsageAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyUsageAdjustments to fetch.
     */
    orderBy?: ModelProxyUsageAdjustmentOrderByWithRelationInput | ModelProxyUsageAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxyUsageAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyUsageAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyUsageAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxyUsageAdjustments
    **/
    _count?: true | ModelProxyUsageAdjustmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ModelProxyUsageAdjustmentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ModelProxyUsageAdjustmentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxyUsageAdjustmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxyUsageAdjustmentMaxAggregateInputType
  }

  export type GetModelProxyUsageAdjustmentAggregateType<T extends ModelProxyUsageAdjustmentAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxyUsageAdjustment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxyUsageAdjustment[P]>
      : GetScalarType<T[P], AggregateModelProxyUsageAdjustment[P]>
  }




  export type ModelProxyUsageAdjustmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyUsageAdjustmentWhereInput
    orderBy?: ModelProxyUsageAdjustmentOrderByWithAggregationInput | ModelProxyUsageAdjustmentOrderByWithAggregationInput[]
    by: ModelProxyUsageAdjustmentScalarFieldEnum[] | ModelProxyUsageAdjustmentScalarFieldEnum
    having?: ModelProxyUsageAdjustmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxyUsageAdjustmentCountAggregateInputType | true
    _avg?: ModelProxyUsageAdjustmentAvgAggregateInputType
    _sum?: ModelProxyUsageAdjustmentSumAggregateInputType
    _min?: ModelProxyUsageAdjustmentMinAggregateInputType
    _max?: ModelProxyUsageAdjustmentMaxAggregateInputType
  }

  export type ModelProxyUsageAdjustmentGroupByOutputType = {
    id: string
    requestId: string
    reason: string
    promptTokensDelta: number
    completionTokensDelta: number
    totalCostDelta: number
    note: string | null
    createdAt: Date
    _count: ModelProxyUsageAdjustmentCountAggregateOutputType | null
    _avg: ModelProxyUsageAdjustmentAvgAggregateOutputType | null
    _sum: ModelProxyUsageAdjustmentSumAggregateOutputType | null
    _min: ModelProxyUsageAdjustmentMinAggregateOutputType | null
    _max: ModelProxyUsageAdjustmentMaxAggregateOutputType | null
  }

  type GetModelProxyUsageAdjustmentGroupByPayload<T extends ModelProxyUsageAdjustmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxyUsageAdjustmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxyUsageAdjustmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxyUsageAdjustmentGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxyUsageAdjustmentGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxyUsageAdjustmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestId?: boolean
    reason?: boolean
    promptTokensDelta?: boolean
    completionTokensDelta?: boolean
    totalCostDelta?: boolean
    note?: boolean
    createdAt?: boolean
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["modelProxyUsageAdjustment"]>

  export type ModelProxyUsageAdjustmentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestId?: boolean
    reason?: boolean
    promptTokensDelta?: boolean
    completionTokensDelta?: boolean
    totalCostDelta?: boolean
    note?: boolean
    createdAt?: boolean
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["modelProxyUsageAdjustment"]>

  export type ModelProxyUsageAdjustmentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestId?: boolean
    reason?: boolean
    promptTokensDelta?: boolean
    completionTokensDelta?: boolean
    totalCostDelta?: boolean
    note?: boolean
    createdAt?: boolean
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["modelProxyUsageAdjustment"]>

  export type ModelProxyUsageAdjustmentSelectScalar = {
    id?: boolean
    requestId?: boolean
    reason?: boolean
    promptTokensDelta?: boolean
    completionTokensDelta?: boolean
    totalCostDelta?: boolean
    note?: boolean
    createdAt?: boolean
  }

  export type ModelProxyUsageAdjustmentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "requestId" | "reason" | "promptTokensDelta" | "completionTokensDelta" | "totalCostDelta" | "note" | "createdAt", ExtArgs["result"]["modelProxyUsageAdjustment"]>
  export type ModelProxyUsageAdjustmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }
  export type ModelProxyUsageAdjustmentIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }
  export type ModelProxyUsageAdjustmentIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }

  export type $ModelProxyUsageAdjustmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxyUsageAdjustment"
    objects: {
      request: Prisma.$ModelProxyRequestPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      requestId: string
      reason: string
      promptTokensDelta: number
      completionTokensDelta: number
      totalCostDelta: number
      note: string | null
      createdAt: Date
    }, ExtArgs["result"]["modelProxyUsageAdjustment"]>
    composites: {}
  }

  type ModelProxyUsageAdjustmentGetPayload<S extends boolean | null | undefined | ModelProxyUsageAdjustmentDefaultArgs> = $Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload, S>

  type ModelProxyUsageAdjustmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxyUsageAdjustmentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxyUsageAdjustmentCountAggregateInputType | true
    }

  export interface ModelProxyUsageAdjustmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxyUsageAdjustment'], meta: { name: 'ModelProxyUsageAdjustment' } }
    /**
     * Find zero or one ModelProxyUsageAdjustment that matches the filter.
     * @param {ModelProxyUsageAdjustmentFindUniqueArgs} args - Arguments to find a ModelProxyUsageAdjustment
     * @example
     * // Get one ModelProxyUsageAdjustment
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxyUsageAdjustmentFindUniqueArgs>(args: SelectSubset<T, ModelProxyUsageAdjustmentFindUniqueArgs<ExtArgs>>): Prisma__ModelProxyUsageAdjustmentClient<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxyUsageAdjustment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxyUsageAdjustmentFindUniqueOrThrowArgs} args - Arguments to find a ModelProxyUsageAdjustment
     * @example
     * // Get one ModelProxyUsageAdjustment
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxyUsageAdjustmentFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxyUsageAdjustmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxyUsageAdjustmentClient<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyUsageAdjustment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyUsageAdjustmentFindFirstArgs} args - Arguments to find a ModelProxyUsageAdjustment
     * @example
     * // Get one ModelProxyUsageAdjustment
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxyUsageAdjustmentFindFirstArgs>(args?: SelectSubset<T, ModelProxyUsageAdjustmentFindFirstArgs<ExtArgs>>): Prisma__ModelProxyUsageAdjustmentClient<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyUsageAdjustment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyUsageAdjustmentFindFirstOrThrowArgs} args - Arguments to find a ModelProxyUsageAdjustment
     * @example
     * // Get one ModelProxyUsageAdjustment
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxyUsageAdjustmentFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxyUsageAdjustmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxyUsageAdjustmentClient<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxyUsageAdjustments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyUsageAdjustmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxyUsageAdjustments
     * const modelProxyUsageAdjustments = await prisma.modelProxyUsageAdjustment.findMany()
     * 
     * // Get first 10 ModelProxyUsageAdjustments
     * const modelProxyUsageAdjustments = await prisma.modelProxyUsageAdjustment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxyUsageAdjustmentWithIdOnly = await prisma.modelProxyUsageAdjustment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxyUsageAdjustmentFindManyArgs>(args?: SelectSubset<T, ModelProxyUsageAdjustmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxyUsageAdjustment.
     * @param {ModelProxyUsageAdjustmentCreateArgs} args - Arguments to create a ModelProxyUsageAdjustment.
     * @example
     * // Create one ModelProxyUsageAdjustment
     * const ModelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.create({
     *   data: {
     *     // ... data to create a ModelProxyUsageAdjustment
     *   }
     * })
     * 
     */
    create<T extends ModelProxyUsageAdjustmentCreateArgs>(args: SelectSubset<T, ModelProxyUsageAdjustmentCreateArgs<ExtArgs>>): Prisma__ModelProxyUsageAdjustmentClient<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxyUsageAdjustments.
     * @param {ModelProxyUsageAdjustmentCreateManyArgs} args - Arguments to create many ModelProxyUsageAdjustments.
     * @example
     * // Create many ModelProxyUsageAdjustments
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxyUsageAdjustmentCreateManyArgs>(args?: SelectSubset<T, ModelProxyUsageAdjustmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxyUsageAdjustments and returns the data saved in the database.
     * @param {ModelProxyUsageAdjustmentCreateManyAndReturnArgs} args - Arguments to create many ModelProxyUsageAdjustments.
     * @example
     * // Create many ModelProxyUsageAdjustments
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxyUsageAdjustments and only return the `id`
     * const modelProxyUsageAdjustmentWithIdOnly = await prisma.modelProxyUsageAdjustment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxyUsageAdjustmentCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxyUsageAdjustmentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxyUsageAdjustment.
     * @param {ModelProxyUsageAdjustmentDeleteArgs} args - Arguments to delete one ModelProxyUsageAdjustment.
     * @example
     * // Delete one ModelProxyUsageAdjustment
     * const ModelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.delete({
     *   where: {
     *     // ... filter to delete one ModelProxyUsageAdjustment
     *   }
     * })
     * 
     */
    delete<T extends ModelProxyUsageAdjustmentDeleteArgs>(args: SelectSubset<T, ModelProxyUsageAdjustmentDeleteArgs<ExtArgs>>): Prisma__ModelProxyUsageAdjustmentClient<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxyUsageAdjustment.
     * @param {ModelProxyUsageAdjustmentUpdateArgs} args - Arguments to update one ModelProxyUsageAdjustment.
     * @example
     * // Update one ModelProxyUsageAdjustment
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxyUsageAdjustmentUpdateArgs>(args: SelectSubset<T, ModelProxyUsageAdjustmentUpdateArgs<ExtArgs>>): Prisma__ModelProxyUsageAdjustmentClient<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxyUsageAdjustments.
     * @param {ModelProxyUsageAdjustmentDeleteManyArgs} args - Arguments to filter ModelProxyUsageAdjustments to delete.
     * @example
     * // Delete a few ModelProxyUsageAdjustments
     * const { count } = await prisma.modelProxyUsageAdjustment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxyUsageAdjustmentDeleteManyArgs>(args?: SelectSubset<T, ModelProxyUsageAdjustmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyUsageAdjustments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyUsageAdjustmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxyUsageAdjustments
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxyUsageAdjustmentUpdateManyArgs>(args: SelectSubset<T, ModelProxyUsageAdjustmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyUsageAdjustments and returns the data updated in the database.
     * @param {ModelProxyUsageAdjustmentUpdateManyAndReturnArgs} args - Arguments to update many ModelProxyUsageAdjustments.
     * @example
     * // Update many ModelProxyUsageAdjustments
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxyUsageAdjustments and only return the `id`
     * const modelProxyUsageAdjustmentWithIdOnly = await prisma.modelProxyUsageAdjustment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxyUsageAdjustmentUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxyUsageAdjustmentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxyUsageAdjustment.
     * @param {ModelProxyUsageAdjustmentUpsertArgs} args - Arguments to update or create a ModelProxyUsageAdjustment.
     * @example
     * // Update or create a ModelProxyUsageAdjustment
     * const modelProxyUsageAdjustment = await prisma.modelProxyUsageAdjustment.upsert({
     *   create: {
     *     // ... data to create a ModelProxyUsageAdjustment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxyUsageAdjustment we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxyUsageAdjustmentUpsertArgs>(args: SelectSubset<T, ModelProxyUsageAdjustmentUpsertArgs<ExtArgs>>): Prisma__ModelProxyUsageAdjustmentClient<$Result.GetResult<Prisma.$ModelProxyUsageAdjustmentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxyUsageAdjustments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyUsageAdjustmentCountArgs} args - Arguments to filter ModelProxyUsageAdjustments to count.
     * @example
     * // Count the number of ModelProxyUsageAdjustments
     * const count = await prisma.modelProxyUsageAdjustment.count({
     *   where: {
     *     // ... the filter for the ModelProxyUsageAdjustments we want to count
     *   }
     * })
    **/
    count<T extends ModelProxyUsageAdjustmentCountArgs>(
      args?: Subset<T, ModelProxyUsageAdjustmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxyUsageAdjustmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxyUsageAdjustment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyUsageAdjustmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxyUsageAdjustmentAggregateArgs>(args: Subset<T, ModelProxyUsageAdjustmentAggregateArgs>): Prisma.PrismaPromise<GetModelProxyUsageAdjustmentAggregateType<T>>

    /**
     * Group by ModelProxyUsageAdjustment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyUsageAdjustmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxyUsageAdjustmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxyUsageAdjustmentGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxyUsageAdjustmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxyUsageAdjustmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxyUsageAdjustmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxyUsageAdjustment model
   */
  readonly fields: ModelProxyUsageAdjustmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxyUsageAdjustment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxyUsageAdjustmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    request<T extends ModelProxyRequestDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ModelProxyRequestDefaultArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxyUsageAdjustment model
   */
  interface ModelProxyUsageAdjustmentFieldRefs {
    readonly id: FieldRef<"ModelProxyUsageAdjustment", 'String'>
    readonly requestId: FieldRef<"ModelProxyUsageAdjustment", 'String'>
    readonly reason: FieldRef<"ModelProxyUsageAdjustment", 'String'>
    readonly promptTokensDelta: FieldRef<"ModelProxyUsageAdjustment", 'Int'>
    readonly completionTokensDelta: FieldRef<"ModelProxyUsageAdjustment", 'Int'>
    readonly totalCostDelta: FieldRef<"ModelProxyUsageAdjustment", 'Float'>
    readonly note: FieldRef<"ModelProxyUsageAdjustment", 'String'>
    readonly createdAt: FieldRef<"ModelProxyUsageAdjustment", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxyUsageAdjustment findUnique
   */
  export type ModelProxyUsageAdjustmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyUsageAdjustment to fetch.
     */
    where: ModelProxyUsageAdjustmentWhereUniqueInput
  }

  /**
   * ModelProxyUsageAdjustment findUniqueOrThrow
   */
  export type ModelProxyUsageAdjustmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyUsageAdjustment to fetch.
     */
    where: ModelProxyUsageAdjustmentWhereUniqueInput
  }

  /**
   * ModelProxyUsageAdjustment findFirst
   */
  export type ModelProxyUsageAdjustmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyUsageAdjustment to fetch.
     */
    where?: ModelProxyUsageAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyUsageAdjustments to fetch.
     */
    orderBy?: ModelProxyUsageAdjustmentOrderByWithRelationInput | ModelProxyUsageAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyUsageAdjustments.
     */
    cursor?: ModelProxyUsageAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyUsageAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyUsageAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyUsageAdjustments.
     */
    distinct?: ModelProxyUsageAdjustmentScalarFieldEnum | ModelProxyUsageAdjustmentScalarFieldEnum[]
  }

  /**
   * ModelProxyUsageAdjustment findFirstOrThrow
   */
  export type ModelProxyUsageAdjustmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyUsageAdjustment to fetch.
     */
    where?: ModelProxyUsageAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyUsageAdjustments to fetch.
     */
    orderBy?: ModelProxyUsageAdjustmentOrderByWithRelationInput | ModelProxyUsageAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyUsageAdjustments.
     */
    cursor?: ModelProxyUsageAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyUsageAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyUsageAdjustments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyUsageAdjustments.
     */
    distinct?: ModelProxyUsageAdjustmentScalarFieldEnum | ModelProxyUsageAdjustmentScalarFieldEnum[]
  }

  /**
   * ModelProxyUsageAdjustment findMany
   */
  export type ModelProxyUsageAdjustmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyUsageAdjustments to fetch.
     */
    where?: ModelProxyUsageAdjustmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyUsageAdjustments to fetch.
     */
    orderBy?: ModelProxyUsageAdjustmentOrderByWithRelationInput | ModelProxyUsageAdjustmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxyUsageAdjustments.
     */
    cursor?: ModelProxyUsageAdjustmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyUsageAdjustments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyUsageAdjustments.
     */
    skip?: number
    distinct?: ModelProxyUsageAdjustmentScalarFieldEnum | ModelProxyUsageAdjustmentScalarFieldEnum[]
  }

  /**
   * ModelProxyUsageAdjustment create
   */
  export type ModelProxyUsageAdjustmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * The data needed to create a ModelProxyUsageAdjustment.
     */
    data: XOR<ModelProxyUsageAdjustmentCreateInput, ModelProxyUsageAdjustmentUncheckedCreateInput>
  }

  /**
   * ModelProxyUsageAdjustment createMany
   */
  export type ModelProxyUsageAdjustmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxyUsageAdjustments.
     */
    data: ModelProxyUsageAdjustmentCreateManyInput | ModelProxyUsageAdjustmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyUsageAdjustment createManyAndReturn
   */
  export type ModelProxyUsageAdjustmentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxyUsageAdjustments.
     */
    data: ModelProxyUsageAdjustmentCreateManyInput | ModelProxyUsageAdjustmentCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ModelProxyUsageAdjustment update
   */
  export type ModelProxyUsageAdjustmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * The data needed to update a ModelProxyUsageAdjustment.
     */
    data: XOR<ModelProxyUsageAdjustmentUpdateInput, ModelProxyUsageAdjustmentUncheckedUpdateInput>
    /**
     * Choose, which ModelProxyUsageAdjustment to update.
     */
    where: ModelProxyUsageAdjustmentWhereUniqueInput
  }

  /**
   * ModelProxyUsageAdjustment updateMany
   */
  export type ModelProxyUsageAdjustmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxyUsageAdjustments.
     */
    data: XOR<ModelProxyUsageAdjustmentUpdateManyMutationInput, ModelProxyUsageAdjustmentUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyUsageAdjustments to update
     */
    where?: ModelProxyUsageAdjustmentWhereInput
    /**
     * Limit how many ModelProxyUsageAdjustments to update.
     */
    limit?: number
  }

  /**
   * ModelProxyUsageAdjustment updateManyAndReturn
   */
  export type ModelProxyUsageAdjustmentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxyUsageAdjustments.
     */
    data: XOR<ModelProxyUsageAdjustmentUpdateManyMutationInput, ModelProxyUsageAdjustmentUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyUsageAdjustments to update
     */
    where?: ModelProxyUsageAdjustmentWhereInput
    /**
     * Limit how many ModelProxyUsageAdjustments to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ModelProxyUsageAdjustment upsert
   */
  export type ModelProxyUsageAdjustmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * The filter to search for the ModelProxyUsageAdjustment to update in case it exists.
     */
    where: ModelProxyUsageAdjustmentWhereUniqueInput
    /**
     * In case the ModelProxyUsageAdjustment found by the `where` argument doesn't exist, create a new ModelProxyUsageAdjustment with this data.
     */
    create: XOR<ModelProxyUsageAdjustmentCreateInput, ModelProxyUsageAdjustmentUncheckedCreateInput>
    /**
     * In case the ModelProxyUsageAdjustment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxyUsageAdjustmentUpdateInput, ModelProxyUsageAdjustmentUncheckedUpdateInput>
  }

  /**
   * ModelProxyUsageAdjustment delete
   */
  export type ModelProxyUsageAdjustmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
    /**
     * Filter which ModelProxyUsageAdjustment to delete.
     */
    where: ModelProxyUsageAdjustmentWhereUniqueInput
  }

  /**
   * ModelProxyUsageAdjustment deleteMany
   */
  export type ModelProxyUsageAdjustmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyUsageAdjustments to delete
     */
    where?: ModelProxyUsageAdjustmentWhereInput
    /**
     * Limit how many ModelProxyUsageAdjustments to delete.
     */
    limit?: number
  }

  /**
   * ModelProxyUsageAdjustment without action
   */
  export type ModelProxyUsageAdjustmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyUsageAdjustment
     */
    select?: ModelProxyUsageAdjustmentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyUsageAdjustment
     */
    omit?: ModelProxyUsageAdjustmentOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyUsageAdjustmentInclude<ExtArgs> | null
  }


  /**
   * Model ModelProxyMessage
   */

  export type AggregateModelProxyMessage = {
    _count: ModelProxyMessageCountAggregateOutputType | null
    _min: ModelProxyMessageMinAggregateOutputType | null
    _max: ModelProxyMessageMaxAggregateOutputType | null
  }

  export type ModelProxyMessageMinAggregateOutputType = {
    id: string | null
    requestId: string | null
    role: string | null
    createdAt: Date | null
  }

  export type ModelProxyMessageMaxAggregateOutputType = {
    id: string | null
    requestId: string | null
    role: string | null
    createdAt: Date | null
  }

  export type ModelProxyMessageCountAggregateOutputType = {
    id: number
    requestId: number
    role: number
    content: number
    createdAt: number
    _all: number
  }


  export type ModelProxyMessageMinAggregateInputType = {
    id?: true
    requestId?: true
    role?: true
    createdAt?: true
  }

  export type ModelProxyMessageMaxAggregateInputType = {
    id?: true
    requestId?: true
    role?: true
    createdAt?: true
  }

  export type ModelProxyMessageCountAggregateInputType = {
    id?: true
    requestId?: true
    role?: true
    content?: true
    createdAt?: true
    _all?: true
  }

  export type ModelProxyMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyMessage to aggregate.
     */
    where?: ModelProxyMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyMessages to fetch.
     */
    orderBy?: ModelProxyMessageOrderByWithRelationInput | ModelProxyMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxyMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxyMessages
    **/
    _count?: true | ModelProxyMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxyMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxyMessageMaxAggregateInputType
  }

  export type GetModelProxyMessageAggregateType<T extends ModelProxyMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxyMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxyMessage[P]>
      : GetScalarType<T[P], AggregateModelProxyMessage[P]>
  }




  export type ModelProxyMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyMessageWhereInput
    orderBy?: ModelProxyMessageOrderByWithAggregationInput | ModelProxyMessageOrderByWithAggregationInput[]
    by: ModelProxyMessageScalarFieldEnum[] | ModelProxyMessageScalarFieldEnum
    having?: ModelProxyMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxyMessageCountAggregateInputType | true
    _min?: ModelProxyMessageMinAggregateInputType
    _max?: ModelProxyMessageMaxAggregateInputType
  }

  export type ModelProxyMessageGroupByOutputType = {
    id: string
    requestId: string
    role: string
    content: JsonValue
    createdAt: Date
    _count: ModelProxyMessageCountAggregateOutputType | null
    _min: ModelProxyMessageMinAggregateOutputType | null
    _max: ModelProxyMessageMaxAggregateOutputType | null
  }

  type GetModelProxyMessageGroupByPayload<T extends ModelProxyMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxyMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxyMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxyMessageGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxyMessageGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxyMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestId?: boolean
    role?: boolean
    content?: boolean
    createdAt?: boolean
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["modelProxyMessage"]>

  export type ModelProxyMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestId?: boolean
    role?: boolean
    content?: boolean
    createdAt?: boolean
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["modelProxyMessage"]>

  export type ModelProxyMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    requestId?: boolean
    role?: boolean
    content?: boolean
    createdAt?: boolean
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["modelProxyMessage"]>

  export type ModelProxyMessageSelectScalar = {
    id?: boolean
    requestId?: boolean
    role?: boolean
    content?: boolean
    createdAt?: boolean
  }

  export type ModelProxyMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "requestId" | "role" | "content" | "createdAt", ExtArgs["result"]["modelProxyMessage"]>
  export type ModelProxyMessageInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }
  export type ModelProxyMessageIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }
  export type ModelProxyMessageIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    request?: boolean | ModelProxyRequestDefaultArgs<ExtArgs>
  }

  export type $ModelProxyMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxyMessage"
    objects: {
      request: Prisma.$ModelProxyRequestPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      requestId: string
      role: string
      content: Prisma.JsonValue
      createdAt: Date
    }, ExtArgs["result"]["modelProxyMessage"]>
    composites: {}
  }

  type ModelProxyMessageGetPayload<S extends boolean | null | undefined | ModelProxyMessageDefaultArgs> = $Result.GetResult<Prisma.$ModelProxyMessagePayload, S>

  type ModelProxyMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxyMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxyMessageCountAggregateInputType | true
    }

  export interface ModelProxyMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxyMessage'], meta: { name: 'ModelProxyMessage' } }
    /**
     * Find zero or one ModelProxyMessage that matches the filter.
     * @param {ModelProxyMessageFindUniqueArgs} args - Arguments to find a ModelProxyMessage
     * @example
     * // Get one ModelProxyMessage
     * const modelProxyMessage = await prisma.modelProxyMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxyMessageFindUniqueArgs>(args: SelectSubset<T, ModelProxyMessageFindUniqueArgs<ExtArgs>>): Prisma__ModelProxyMessageClient<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxyMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxyMessageFindUniqueOrThrowArgs} args - Arguments to find a ModelProxyMessage
     * @example
     * // Get one ModelProxyMessage
     * const modelProxyMessage = await prisma.modelProxyMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxyMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxyMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxyMessageClient<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyMessageFindFirstArgs} args - Arguments to find a ModelProxyMessage
     * @example
     * // Get one ModelProxyMessage
     * const modelProxyMessage = await prisma.modelProxyMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxyMessageFindFirstArgs>(args?: SelectSubset<T, ModelProxyMessageFindFirstArgs<ExtArgs>>): Prisma__ModelProxyMessageClient<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyMessageFindFirstOrThrowArgs} args - Arguments to find a ModelProxyMessage
     * @example
     * // Get one ModelProxyMessage
     * const modelProxyMessage = await prisma.modelProxyMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxyMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxyMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxyMessageClient<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxyMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxyMessages
     * const modelProxyMessages = await prisma.modelProxyMessage.findMany()
     * 
     * // Get first 10 ModelProxyMessages
     * const modelProxyMessages = await prisma.modelProxyMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxyMessageWithIdOnly = await prisma.modelProxyMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxyMessageFindManyArgs>(args?: SelectSubset<T, ModelProxyMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxyMessage.
     * @param {ModelProxyMessageCreateArgs} args - Arguments to create a ModelProxyMessage.
     * @example
     * // Create one ModelProxyMessage
     * const ModelProxyMessage = await prisma.modelProxyMessage.create({
     *   data: {
     *     // ... data to create a ModelProxyMessage
     *   }
     * })
     * 
     */
    create<T extends ModelProxyMessageCreateArgs>(args: SelectSubset<T, ModelProxyMessageCreateArgs<ExtArgs>>): Prisma__ModelProxyMessageClient<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxyMessages.
     * @param {ModelProxyMessageCreateManyArgs} args - Arguments to create many ModelProxyMessages.
     * @example
     * // Create many ModelProxyMessages
     * const modelProxyMessage = await prisma.modelProxyMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxyMessageCreateManyArgs>(args?: SelectSubset<T, ModelProxyMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxyMessages and returns the data saved in the database.
     * @param {ModelProxyMessageCreateManyAndReturnArgs} args - Arguments to create many ModelProxyMessages.
     * @example
     * // Create many ModelProxyMessages
     * const modelProxyMessage = await prisma.modelProxyMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxyMessages and only return the `id`
     * const modelProxyMessageWithIdOnly = await prisma.modelProxyMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxyMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxyMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxyMessage.
     * @param {ModelProxyMessageDeleteArgs} args - Arguments to delete one ModelProxyMessage.
     * @example
     * // Delete one ModelProxyMessage
     * const ModelProxyMessage = await prisma.modelProxyMessage.delete({
     *   where: {
     *     // ... filter to delete one ModelProxyMessage
     *   }
     * })
     * 
     */
    delete<T extends ModelProxyMessageDeleteArgs>(args: SelectSubset<T, ModelProxyMessageDeleteArgs<ExtArgs>>): Prisma__ModelProxyMessageClient<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxyMessage.
     * @param {ModelProxyMessageUpdateArgs} args - Arguments to update one ModelProxyMessage.
     * @example
     * // Update one ModelProxyMessage
     * const modelProxyMessage = await prisma.modelProxyMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxyMessageUpdateArgs>(args: SelectSubset<T, ModelProxyMessageUpdateArgs<ExtArgs>>): Prisma__ModelProxyMessageClient<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxyMessages.
     * @param {ModelProxyMessageDeleteManyArgs} args - Arguments to filter ModelProxyMessages to delete.
     * @example
     * // Delete a few ModelProxyMessages
     * const { count } = await prisma.modelProxyMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxyMessageDeleteManyArgs>(args?: SelectSubset<T, ModelProxyMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxyMessages
     * const modelProxyMessage = await prisma.modelProxyMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxyMessageUpdateManyArgs>(args: SelectSubset<T, ModelProxyMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyMessages and returns the data updated in the database.
     * @param {ModelProxyMessageUpdateManyAndReturnArgs} args - Arguments to update many ModelProxyMessages.
     * @example
     * // Update many ModelProxyMessages
     * const modelProxyMessage = await prisma.modelProxyMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxyMessages and only return the `id`
     * const modelProxyMessageWithIdOnly = await prisma.modelProxyMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxyMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxyMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxyMessage.
     * @param {ModelProxyMessageUpsertArgs} args - Arguments to update or create a ModelProxyMessage.
     * @example
     * // Update or create a ModelProxyMessage
     * const modelProxyMessage = await prisma.modelProxyMessage.upsert({
     *   create: {
     *     // ... data to create a ModelProxyMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxyMessage we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxyMessageUpsertArgs>(args: SelectSubset<T, ModelProxyMessageUpsertArgs<ExtArgs>>): Prisma__ModelProxyMessageClient<$Result.GetResult<Prisma.$ModelProxyMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxyMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyMessageCountArgs} args - Arguments to filter ModelProxyMessages to count.
     * @example
     * // Count the number of ModelProxyMessages
     * const count = await prisma.modelProxyMessage.count({
     *   where: {
     *     // ... the filter for the ModelProxyMessages we want to count
     *   }
     * })
    **/
    count<T extends ModelProxyMessageCountArgs>(
      args?: Subset<T, ModelProxyMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxyMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxyMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxyMessageAggregateArgs>(args: Subset<T, ModelProxyMessageAggregateArgs>): Prisma.PrismaPromise<GetModelProxyMessageAggregateType<T>>

    /**
     * Group by ModelProxyMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxyMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxyMessageGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxyMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxyMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxyMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxyMessage model
   */
  readonly fields: ModelProxyMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxyMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxyMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    request<T extends ModelProxyRequestDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ModelProxyRequestDefaultArgs<ExtArgs>>): Prisma__ModelProxyRequestClient<$Result.GetResult<Prisma.$ModelProxyRequestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxyMessage model
   */
  interface ModelProxyMessageFieldRefs {
    readonly id: FieldRef<"ModelProxyMessage", 'String'>
    readonly requestId: FieldRef<"ModelProxyMessage", 'String'>
    readonly role: FieldRef<"ModelProxyMessage", 'String'>
    readonly content: FieldRef<"ModelProxyMessage", 'Json'>
    readonly createdAt: FieldRef<"ModelProxyMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxyMessage findUnique
   */
  export type ModelProxyMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyMessage to fetch.
     */
    where: ModelProxyMessageWhereUniqueInput
  }

  /**
   * ModelProxyMessage findUniqueOrThrow
   */
  export type ModelProxyMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyMessage to fetch.
     */
    where: ModelProxyMessageWhereUniqueInput
  }

  /**
   * ModelProxyMessage findFirst
   */
  export type ModelProxyMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyMessage to fetch.
     */
    where?: ModelProxyMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyMessages to fetch.
     */
    orderBy?: ModelProxyMessageOrderByWithRelationInput | ModelProxyMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyMessages.
     */
    cursor?: ModelProxyMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyMessages.
     */
    distinct?: ModelProxyMessageScalarFieldEnum | ModelProxyMessageScalarFieldEnum[]
  }

  /**
   * ModelProxyMessage findFirstOrThrow
   */
  export type ModelProxyMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyMessage to fetch.
     */
    where?: ModelProxyMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyMessages to fetch.
     */
    orderBy?: ModelProxyMessageOrderByWithRelationInput | ModelProxyMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyMessages.
     */
    cursor?: ModelProxyMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyMessages.
     */
    distinct?: ModelProxyMessageScalarFieldEnum | ModelProxyMessageScalarFieldEnum[]
  }

  /**
   * ModelProxyMessage findMany
   */
  export type ModelProxyMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * Filter, which ModelProxyMessages to fetch.
     */
    where?: ModelProxyMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyMessages to fetch.
     */
    orderBy?: ModelProxyMessageOrderByWithRelationInput | ModelProxyMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxyMessages.
     */
    cursor?: ModelProxyMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyMessages.
     */
    skip?: number
    distinct?: ModelProxyMessageScalarFieldEnum | ModelProxyMessageScalarFieldEnum[]
  }

  /**
   * ModelProxyMessage create
   */
  export type ModelProxyMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * The data needed to create a ModelProxyMessage.
     */
    data: XOR<ModelProxyMessageCreateInput, ModelProxyMessageUncheckedCreateInput>
  }

  /**
   * ModelProxyMessage createMany
   */
  export type ModelProxyMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxyMessages.
     */
    data: ModelProxyMessageCreateManyInput | ModelProxyMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyMessage createManyAndReturn
   */
  export type ModelProxyMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxyMessages.
     */
    data: ModelProxyMessageCreateManyInput | ModelProxyMessageCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * ModelProxyMessage update
   */
  export type ModelProxyMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * The data needed to update a ModelProxyMessage.
     */
    data: XOR<ModelProxyMessageUpdateInput, ModelProxyMessageUncheckedUpdateInput>
    /**
     * Choose, which ModelProxyMessage to update.
     */
    where: ModelProxyMessageWhereUniqueInput
  }

  /**
   * ModelProxyMessage updateMany
   */
  export type ModelProxyMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxyMessages.
     */
    data: XOR<ModelProxyMessageUpdateManyMutationInput, ModelProxyMessageUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyMessages to update
     */
    where?: ModelProxyMessageWhereInput
    /**
     * Limit how many ModelProxyMessages to update.
     */
    limit?: number
  }

  /**
   * ModelProxyMessage updateManyAndReturn
   */
  export type ModelProxyMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxyMessages.
     */
    data: XOR<ModelProxyMessageUpdateManyMutationInput, ModelProxyMessageUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyMessages to update
     */
    where?: ModelProxyMessageWhereInput
    /**
     * Limit how many ModelProxyMessages to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * ModelProxyMessage upsert
   */
  export type ModelProxyMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * The filter to search for the ModelProxyMessage to update in case it exists.
     */
    where: ModelProxyMessageWhereUniqueInput
    /**
     * In case the ModelProxyMessage found by the `where` argument doesn't exist, create a new ModelProxyMessage with this data.
     */
    create: XOR<ModelProxyMessageCreateInput, ModelProxyMessageUncheckedCreateInput>
    /**
     * In case the ModelProxyMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxyMessageUpdateInput, ModelProxyMessageUncheckedUpdateInput>
  }

  /**
   * ModelProxyMessage delete
   */
  export type ModelProxyMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
    /**
     * Filter which ModelProxyMessage to delete.
     */
    where: ModelProxyMessageWhereUniqueInput
  }

  /**
   * ModelProxyMessage deleteMany
   */
  export type ModelProxyMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyMessages to delete
     */
    where?: ModelProxyMessageWhereInput
    /**
     * Limit how many ModelProxyMessages to delete.
     */
    limit?: number
  }

  /**
   * ModelProxyMessage without action
   */
  export type ModelProxyMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyMessage
     */
    select?: ModelProxyMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyMessage
     */
    omit?: ModelProxyMessageOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelProxyMessageInclude<ExtArgs> | null
  }


  /**
   * Model ModelProxyModel
   */

  export type AggregateModelProxyModel = {
    _count: ModelProxyModelCountAggregateOutputType | null
    _avg: ModelProxyModelAvgAggregateOutputType | null
    _sum: ModelProxyModelSumAggregateOutputType | null
    _min: ModelProxyModelMinAggregateOutputType | null
    _max: ModelProxyModelMaxAggregateOutputType | null
  }

  export type ModelProxyModelAvgAggregateOutputType = {
    contextWindowSize: number | null
    maxOutputTokens: number | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
  }

  export type ModelProxyModelSumAggregateOutputType = {
    contextWindowSize: number | null
    maxOutputTokens: number | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
  }

  export type ModelProxyModelMinAggregateOutputType = {
    id: string | null
    modelName: string | null
    enabled: boolean | null
    displayName: string | null
    family: string | null
    ownedBy: string | null
    apiMode: string | null
    vision: boolean | null
    contextWindowSize: number | null
    maxOutputTokens: number | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
    upstreamModel: string | null
    upstreamBaseUrl: string | null
    credentialName: string | null
    secretRef: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxyModelMaxAggregateOutputType = {
    id: string | null
    modelName: string | null
    enabled: boolean | null
    displayName: string | null
    family: string | null
    ownedBy: string | null
    apiMode: string | null
    vision: boolean | null
    contextWindowSize: number | null
    maxOutputTokens: number | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
    upstreamModel: string | null
    upstreamBaseUrl: string | null
    credentialName: string | null
    secretRef: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxyModelCountAggregateOutputType = {
    id: number
    modelName: number
    enabled: number
    displayName: number
    family: number
    ownedBy: number
    apiMode: number
    vision: number
    contextWindowSize: number
    maxOutputTokens: number
    inputCostPerToken: number
    outputCostPerToken: number
    upstreamModel: number
    upstreamBaseUrl: number
    credentialName: number
    secretRef: number
    requestOptions: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ModelProxyModelAvgAggregateInputType = {
    contextWindowSize?: true
    maxOutputTokens?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
  }

  export type ModelProxyModelSumAggregateInputType = {
    contextWindowSize?: true
    maxOutputTokens?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
  }

  export type ModelProxyModelMinAggregateInputType = {
    id?: true
    modelName?: true
    enabled?: true
    displayName?: true
    family?: true
    ownedBy?: true
    apiMode?: true
    vision?: true
    contextWindowSize?: true
    maxOutputTokens?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
    upstreamModel?: true
    upstreamBaseUrl?: true
    credentialName?: true
    secretRef?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxyModelMaxAggregateInputType = {
    id?: true
    modelName?: true
    enabled?: true
    displayName?: true
    family?: true
    ownedBy?: true
    apiMode?: true
    vision?: true
    contextWindowSize?: true
    maxOutputTokens?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
    upstreamModel?: true
    upstreamBaseUrl?: true
    credentialName?: true
    secretRef?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxyModelCountAggregateInputType = {
    id?: true
    modelName?: true
    enabled?: true
    displayName?: true
    family?: true
    ownedBy?: true
    apiMode?: true
    vision?: true
    contextWindowSize?: true
    maxOutputTokens?: true
    inputCostPerToken?: true
    outputCostPerToken?: true
    upstreamModel?: true
    upstreamBaseUrl?: true
    credentialName?: true
    secretRef?: true
    requestOptions?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ModelProxyModelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyModel to aggregate.
     */
    where?: ModelProxyModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyModels to fetch.
     */
    orderBy?: ModelProxyModelOrderByWithRelationInput | ModelProxyModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxyModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxyModels
    **/
    _count?: true | ModelProxyModelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ModelProxyModelAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ModelProxyModelSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxyModelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxyModelMaxAggregateInputType
  }

  export type GetModelProxyModelAggregateType<T extends ModelProxyModelAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxyModel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxyModel[P]>
      : GetScalarType<T[P], AggregateModelProxyModel[P]>
  }




  export type ModelProxyModelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyModelWhereInput
    orderBy?: ModelProxyModelOrderByWithAggregationInput | ModelProxyModelOrderByWithAggregationInput[]
    by: ModelProxyModelScalarFieldEnum[] | ModelProxyModelScalarFieldEnum
    having?: ModelProxyModelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxyModelCountAggregateInputType | true
    _avg?: ModelProxyModelAvgAggregateInputType
    _sum?: ModelProxyModelSumAggregateInputType
    _min?: ModelProxyModelMinAggregateInputType
    _max?: ModelProxyModelMaxAggregateInputType
  }

  export type ModelProxyModelGroupByOutputType = {
    id: string
    modelName: string
    enabled: boolean
    displayName: string | null
    family: string | null
    ownedBy: string | null
    apiMode: string | null
    vision: boolean | null
    contextWindowSize: number | null
    maxOutputTokens: number | null
    inputCostPerToken: number | null
    outputCostPerToken: number | null
    upstreamModel: string | null
    upstreamBaseUrl: string | null
    credentialName: string | null
    secretRef: string | null
    requestOptions: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: ModelProxyModelCountAggregateOutputType | null
    _avg: ModelProxyModelAvgAggregateOutputType | null
    _sum: ModelProxyModelSumAggregateOutputType | null
    _min: ModelProxyModelMinAggregateOutputType | null
    _max: ModelProxyModelMaxAggregateOutputType | null
  }

  type GetModelProxyModelGroupByPayload<T extends ModelProxyModelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxyModelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxyModelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxyModelGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxyModelGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxyModelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelName?: boolean
    enabled?: boolean
    displayName?: boolean
    family?: boolean
    ownedBy?: boolean
    apiMode?: boolean
    vision?: boolean
    contextWindowSize?: boolean
    maxOutputTokens?: boolean
    inputCostPerToken?: boolean
    outputCostPerToken?: boolean
    upstreamModel?: boolean
    upstreamBaseUrl?: boolean
    credentialName?: boolean
    secretRef?: boolean
    requestOptions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyModel"]>

  export type ModelProxyModelSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelName?: boolean
    enabled?: boolean
    displayName?: boolean
    family?: boolean
    ownedBy?: boolean
    apiMode?: boolean
    vision?: boolean
    contextWindowSize?: boolean
    maxOutputTokens?: boolean
    inputCostPerToken?: boolean
    outputCostPerToken?: boolean
    upstreamModel?: boolean
    upstreamBaseUrl?: boolean
    credentialName?: boolean
    secretRef?: boolean
    requestOptions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyModel"]>

  export type ModelProxyModelSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelName?: boolean
    enabled?: boolean
    displayName?: boolean
    family?: boolean
    ownedBy?: boolean
    apiMode?: boolean
    vision?: boolean
    contextWindowSize?: boolean
    maxOutputTokens?: boolean
    inputCostPerToken?: boolean
    outputCostPerToken?: boolean
    upstreamModel?: boolean
    upstreamBaseUrl?: boolean
    credentialName?: boolean
    secretRef?: boolean
    requestOptions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyModel"]>

  export type ModelProxyModelSelectScalar = {
    id?: boolean
    modelName?: boolean
    enabled?: boolean
    displayName?: boolean
    family?: boolean
    ownedBy?: boolean
    apiMode?: boolean
    vision?: boolean
    contextWindowSize?: boolean
    maxOutputTokens?: boolean
    inputCostPerToken?: boolean
    outputCostPerToken?: boolean
    upstreamModel?: boolean
    upstreamBaseUrl?: boolean
    credentialName?: boolean
    secretRef?: boolean
    requestOptions?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ModelProxyModelOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "modelName" | "enabled" | "displayName" | "family" | "ownedBy" | "apiMode" | "vision" | "contextWindowSize" | "maxOutputTokens" | "inputCostPerToken" | "outputCostPerToken" | "upstreamModel" | "upstreamBaseUrl" | "credentialName" | "secretRef" | "requestOptions" | "createdAt" | "updatedAt", ExtArgs["result"]["modelProxyModel"]>

  export type $ModelProxyModelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxyModel"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      modelName: string
      enabled: boolean
      displayName: string | null
      family: string | null
      ownedBy: string | null
      apiMode: string | null
      vision: boolean | null
      contextWindowSize: number | null
      maxOutputTokens: number | null
      inputCostPerToken: number | null
      outputCostPerToken: number | null
      upstreamModel: string | null
      upstreamBaseUrl: string | null
      credentialName: string | null
      secretRef: string | null
      requestOptions: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["modelProxyModel"]>
    composites: {}
  }

  type ModelProxyModelGetPayload<S extends boolean | null | undefined | ModelProxyModelDefaultArgs> = $Result.GetResult<Prisma.$ModelProxyModelPayload, S>

  type ModelProxyModelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxyModelFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxyModelCountAggregateInputType | true
    }

  export interface ModelProxyModelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxyModel'], meta: { name: 'ModelProxyModel' } }
    /**
     * Find zero or one ModelProxyModel that matches the filter.
     * @param {ModelProxyModelFindUniqueArgs} args - Arguments to find a ModelProxyModel
     * @example
     * // Get one ModelProxyModel
     * const modelProxyModel = await prisma.modelProxyModel.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxyModelFindUniqueArgs>(args: SelectSubset<T, ModelProxyModelFindUniqueArgs<ExtArgs>>): Prisma__ModelProxyModelClient<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxyModel that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxyModelFindUniqueOrThrowArgs} args - Arguments to find a ModelProxyModel
     * @example
     * // Get one ModelProxyModel
     * const modelProxyModel = await prisma.modelProxyModel.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxyModelFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxyModelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxyModelClient<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyModel that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyModelFindFirstArgs} args - Arguments to find a ModelProxyModel
     * @example
     * // Get one ModelProxyModel
     * const modelProxyModel = await prisma.modelProxyModel.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxyModelFindFirstArgs>(args?: SelectSubset<T, ModelProxyModelFindFirstArgs<ExtArgs>>): Prisma__ModelProxyModelClient<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyModel that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyModelFindFirstOrThrowArgs} args - Arguments to find a ModelProxyModel
     * @example
     * // Get one ModelProxyModel
     * const modelProxyModel = await prisma.modelProxyModel.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxyModelFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxyModelFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxyModelClient<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxyModels that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyModelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxyModels
     * const modelProxyModels = await prisma.modelProxyModel.findMany()
     * 
     * // Get first 10 ModelProxyModels
     * const modelProxyModels = await prisma.modelProxyModel.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxyModelWithIdOnly = await prisma.modelProxyModel.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxyModelFindManyArgs>(args?: SelectSubset<T, ModelProxyModelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxyModel.
     * @param {ModelProxyModelCreateArgs} args - Arguments to create a ModelProxyModel.
     * @example
     * // Create one ModelProxyModel
     * const ModelProxyModel = await prisma.modelProxyModel.create({
     *   data: {
     *     // ... data to create a ModelProxyModel
     *   }
     * })
     * 
     */
    create<T extends ModelProxyModelCreateArgs>(args: SelectSubset<T, ModelProxyModelCreateArgs<ExtArgs>>): Prisma__ModelProxyModelClient<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxyModels.
     * @param {ModelProxyModelCreateManyArgs} args - Arguments to create many ModelProxyModels.
     * @example
     * // Create many ModelProxyModels
     * const modelProxyModel = await prisma.modelProxyModel.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxyModelCreateManyArgs>(args?: SelectSubset<T, ModelProxyModelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxyModels and returns the data saved in the database.
     * @param {ModelProxyModelCreateManyAndReturnArgs} args - Arguments to create many ModelProxyModels.
     * @example
     * // Create many ModelProxyModels
     * const modelProxyModel = await prisma.modelProxyModel.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxyModels and only return the `id`
     * const modelProxyModelWithIdOnly = await prisma.modelProxyModel.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxyModelCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxyModelCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxyModel.
     * @param {ModelProxyModelDeleteArgs} args - Arguments to delete one ModelProxyModel.
     * @example
     * // Delete one ModelProxyModel
     * const ModelProxyModel = await prisma.modelProxyModel.delete({
     *   where: {
     *     // ... filter to delete one ModelProxyModel
     *   }
     * })
     * 
     */
    delete<T extends ModelProxyModelDeleteArgs>(args: SelectSubset<T, ModelProxyModelDeleteArgs<ExtArgs>>): Prisma__ModelProxyModelClient<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxyModel.
     * @param {ModelProxyModelUpdateArgs} args - Arguments to update one ModelProxyModel.
     * @example
     * // Update one ModelProxyModel
     * const modelProxyModel = await prisma.modelProxyModel.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxyModelUpdateArgs>(args: SelectSubset<T, ModelProxyModelUpdateArgs<ExtArgs>>): Prisma__ModelProxyModelClient<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxyModels.
     * @param {ModelProxyModelDeleteManyArgs} args - Arguments to filter ModelProxyModels to delete.
     * @example
     * // Delete a few ModelProxyModels
     * const { count } = await prisma.modelProxyModel.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxyModelDeleteManyArgs>(args?: SelectSubset<T, ModelProxyModelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyModels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyModelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxyModels
     * const modelProxyModel = await prisma.modelProxyModel.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxyModelUpdateManyArgs>(args: SelectSubset<T, ModelProxyModelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyModels and returns the data updated in the database.
     * @param {ModelProxyModelUpdateManyAndReturnArgs} args - Arguments to update many ModelProxyModels.
     * @example
     * // Update many ModelProxyModels
     * const modelProxyModel = await prisma.modelProxyModel.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxyModels and only return the `id`
     * const modelProxyModelWithIdOnly = await prisma.modelProxyModel.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxyModelUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxyModelUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxyModel.
     * @param {ModelProxyModelUpsertArgs} args - Arguments to update or create a ModelProxyModel.
     * @example
     * // Update or create a ModelProxyModel
     * const modelProxyModel = await prisma.modelProxyModel.upsert({
     *   create: {
     *     // ... data to create a ModelProxyModel
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxyModel we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxyModelUpsertArgs>(args: SelectSubset<T, ModelProxyModelUpsertArgs<ExtArgs>>): Prisma__ModelProxyModelClient<$Result.GetResult<Prisma.$ModelProxyModelPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxyModels.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyModelCountArgs} args - Arguments to filter ModelProxyModels to count.
     * @example
     * // Count the number of ModelProxyModels
     * const count = await prisma.modelProxyModel.count({
     *   where: {
     *     // ... the filter for the ModelProxyModels we want to count
     *   }
     * })
    **/
    count<T extends ModelProxyModelCountArgs>(
      args?: Subset<T, ModelProxyModelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxyModelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxyModel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyModelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxyModelAggregateArgs>(args: Subset<T, ModelProxyModelAggregateArgs>): Prisma.PrismaPromise<GetModelProxyModelAggregateType<T>>

    /**
     * Group by ModelProxyModel.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyModelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxyModelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxyModelGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxyModelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxyModelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxyModelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxyModel model
   */
  readonly fields: ModelProxyModelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxyModel.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxyModelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxyModel model
   */
  interface ModelProxyModelFieldRefs {
    readonly id: FieldRef<"ModelProxyModel", 'String'>
    readonly modelName: FieldRef<"ModelProxyModel", 'String'>
    readonly enabled: FieldRef<"ModelProxyModel", 'Boolean'>
    readonly displayName: FieldRef<"ModelProxyModel", 'String'>
    readonly family: FieldRef<"ModelProxyModel", 'String'>
    readonly ownedBy: FieldRef<"ModelProxyModel", 'String'>
    readonly apiMode: FieldRef<"ModelProxyModel", 'String'>
    readonly vision: FieldRef<"ModelProxyModel", 'Boolean'>
    readonly contextWindowSize: FieldRef<"ModelProxyModel", 'Int'>
    readonly maxOutputTokens: FieldRef<"ModelProxyModel", 'Int'>
    readonly inputCostPerToken: FieldRef<"ModelProxyModel", 'Float'>
    readonly outputCostPerToken: FieldRef<"ModelProxyModel", 'Float'>
    readonly upstreamModel: FieldRef<"ModelProxyModel", 'String'>
    readonly upstreamBaseUrl: FieldRef<"ModelProxyModel", 'String'>
    readonly credentialName: FieldRef<"ModelProxyModel", 'String'>
    readonly secretRef: FieldRef<"ModelProxyModel", 'String'>
    readonly requestOptions: FieldRef<"ModelProxyModel", 'Json'>
    readonly createdAt: FieldRef<"ModelProxyModel", 'DateTime'>
    readonly updatedAt: FieldRef<"ModelProxyModel", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxyModel findUnique
   */
  export type ModelProxyModelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyModel to fetch.
     */
    where: ModelProxyModelWhereUniqueInput
  }

  /**
   * ModelProxyModel findUniqueOrThrow
   */
  export type ModelProxyModelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyModel to fetch.
     */
    where: ModelProxyModelWhereUniqueInput
  }

  /**
   * ModelProxyModel findFirst
   */
  export type ModelProxyModelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyModel to fetch.
     */
    where?: ModelProxyModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyModels to fetch.
     */
    orderBy?: ModelProxyModelOrderByWithRelationInput | ModelProxyModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyModels.
     */
    cursor?: ModelProxyModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyModels.
     */
    distinct?: ModelProxyModelScalarFieldEnum | ModelProxyModelScalarFieldEnum[]
  }

  /**
   * ModelProxyModel findFirstOrThrow
   */
  export type ModelProxyModelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyModel to fetch.
     */
    where?: ModelProxyModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyModels to fetch.
     */
    orderBy?: ModelProxyModelOrderByWithRelationInput | ModelProxyModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyModels.
     */
    cursor?: ModelProxyModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyModels.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyModels.
     */
    distinct?: ModelProxyModelScalarFieldEnum | ModelProxyModelScalarFieldEnum[]
  }

  /**
   * ModelProxyModel findMany
   */
  export type ModelProxyModelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyModels to fetch.
     */
    where?: ModelProxyModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyModels to fetch.
     */
    orderBy?: ModelProxyModelOrderByWithRelationInput | ModelProxyModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxyModels.
     */
    cursor?: ModelProxyModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyModels from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyModels.
     */
    skip?: number
    distinct?: ModelProxyModelScalarFieldEnum | ModelProxyModelScalarFieldEnum[]
  }

  /**
   * ModelProxyModel create
   */
  export type ModelProxyModelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * The data needed to create a ModelProxyModel.
     */
    data: XOR<ModelProxyModelCreateInput, ModelProxyModelUncheckedCreateInput>
  }

  /**
   * ModelProxyModel createMany
   */
  export type ModelProxyModelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxyModels.
     */
    data: ModelProxyModelCreateManyInput | ModelProxyModelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyModel createManyAndReturn
   */
  export type ModelProxyModelCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxyModels.
     */
    data: ModelProxyModelCreateManyInput | ModelProxyModelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyModel update
   */
  export type ModelProxyModelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * The data needed to update a ModelProxyModel.
     */
    data: XOR<ModelProxyModelUpdateInput, ModelProxyModelUncheckedUpdateInput>
    /**
     * Choose, which ModelProxyModel to update.
     */
    where: ModelProxyModelWhereUniqueInput
  }

  /**
   * ModelProxyModel updateMany
   */
  export type ModelProxyModelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxyModels.
     */
    data: XOR<ModelProxyModelUpdateManyMutationInput, ModelProxyModelUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyModels to update
     */
    where?: ModelProxyModelWhereInput
    /**
     * Limit how many ModelProxyModels to update.
     */
    limit?: number
  }

  /**
   * ModelProxyModel updateManyAndReturn
   */
  export type ModelProxyModelUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxyModels.
     */
    data: XOR<ModelProxyModelUpdateManyMutationInput, ModelProxyModelUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyModels to update
     */
    where?: ModelProxyModelWhereInput
    /**
     * Limit how many ModelProxyModels to update.
     */
    limit?: number
  }

  /**
   * ModelProxyModel upsert
   */
  export type ModelProxyModelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * The filter to search for the ModelProxyModel to update in case it exists.
     */
    where: ModelProxyModelWhereUniqueInput
    /**
     * In case the ModelProxyModel found by the `where` argument doesn't exist, create a new ModelProxyModel with this data.
     */
    create: XOR<ModelProxyModelCreateInput, ModelProxyModelUncheckedCreateInput>
    /**
     * In case the ModelProxyModel was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxyModelUpdateInput, ModelProxyModelUncheckedUpdateInput>
  }

  /**
   * ModelProxyModel delete
   */
  export type ModelProxyModelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
    /**
     * Filter which ModelProxyModel to delete.
     */
    where: ModelProxyModelWhereUniqueInput
  }

  /**
   * ModelProxyModel deleteMany
   */
  export type ModelProxyModelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyModels to delete
     */
    where?: ModelProxyModelWhereInput
    /**
     * Limit how many ModelProxyModels to delete.
     */
    limit?: number
  }

  /**
   * ModelProxyModel without action
   */
  export type ModelProxyModelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyModel
     */
    select?: ModelProxyModelSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyModel
     */
    omit?: ModelProxyModelOmit<ExtArgs> | null
  }


  /**
   * Model ModelProxyCredential
   */

  export type AggregateModelProxyCredential = {
    _count: ModelProxyCredentialCountAggregateOutputType | null
    _min: ModelProxyCredentialMinAggregateOutputType | null
    _max: ModelProxyCredentialMaxAggregateOutputType | null
  }

  export type ModelProxyCredentialMinAggregateOutputType = {
    id: string | null
    name: string | null
    provider: string | null
    baseUrl: string | null
    apiKey: string | null
    secretRef: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxyCredentialMaxAggregateOutputType = {
    id: string | null
    name: string | null
    provider: string | null
    baseUrl: string | null
    apiKey: string | null
    secretRef: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxyCredentialCountAggregateOutputType = {
    id: number
    name: number
    provider: number
    baseUrl: number
    apiKey: number
    secretRef: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ModelProxyCredentialMinAggregateInputType = {
    id?: true
    name?: true
    provider?: true
    baseUrl?: true
    apiKey?: true
    secretRef?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxyCredentialMaxAggregateInputType = {
    id?: true
    name?: true
    provider?: true
    baseUrl?: true
    apiKey?: true
    secretRef?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxyCredentialCountAggregateInputType = {
    id?: true
    name?: true
    provider?: true
    baseUrl?: true
    apiKey?: true
    secretRef?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ModelProxyCredentialAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyCredential to aggregate.
     */
    where?: ModelProxyCredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyCredentials to fetch.
     */
    orderBy?: ModelProxyCredentialOrderByWithRelationInput | ModelProxyCredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxyCredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyCredentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyCredentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxyCredentials
    **/
    _count?: true | ModelProxyCredentialCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxyCredentialMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxyCredentialMaxAggregateInputType
  }

  export type GetModelProxyCredentialAggregateType<T extends ModelProxyCredentialAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxyCredential]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxyCredential[P]>
      : GetScalarType<T[P], AggregateModelProxyCredential[P]>
  }




  export type ModelProxyCredentialGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyCredentialWhereInput
    orderBy?: ModelProxyCredentialOrderByWithAggregationInput | ModelProxyCredentialOrderByWithAggregationInput[]
    by: ModelProxyCredentialScalarFieldEnum[] | ModelProxyCredentialScalarFieldEnum
    having?: ModelProxyCredentialScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxyCredentialCountAggregateInputType | true
    _min?: ModelProxyCredentialMinAggregateInputType
    _max?: ModelProxyCredentialMaxAggregateInputType
  }

  export type ModelProxyCredentialGroupByOutputType = {
    id: string
    name: string
    provider: string | null
    baseUrl: string | null
    apiKey: string | null
    secretRef: string | null
    createdAt: Date
    updatedAt: Date
    _count: ModelProxyCredentialCountAggregateOutputType | null
    _min: ModelProxyCredentialMinAggregateOutputType | null
    _max: ModelProxyCredentialMaxAggregateOutputType | null
  }

  type GetModelProxyCredentialGroupByPayload<T extends ModelProxyCredentialGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxyCredentialGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxyCredentialGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxyCredentialGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxyCredentialGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxyCredentialSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    provider?: boolean
    baseUrl?: boolean
    apiKey?: boolean
    secretRef?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyCredential"]>

  export type ModelProxyCredentialSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    provider?: boolean
    baseUrl?: boolean
    apiKey?: boolean
    secretRef?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyCredential"]>

  export type ModelProxyCredentialSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    provider?: boolean
    baseUrl?: boolean
    apiKey?: boolean
    secretRef?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyCredential"]>

  export type ModelProxyCredentialSelectScalar = {
    id?: boolean
    name?: boolean
    provider?: boolean
    baseUrl?: boolean
    apiKey?: boolean
    secretRef?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ModelProxyCredentialOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "provider" | "baseUrl" | "apiKey" | "secretRef" | "createdAt" | "updatedAt", ExtArgs["result"]["modelProxyCredential"]>

  export type $ModelProxyCredentialPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxyCredential"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      provider: string | null
      baseUrl: string | null
      apiKey: string | null
      secretRef: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["modelProxyCredential"]>
    composites: {}
  }

  type ModelProxyCredentialGetPayload<S extends boolean | null | undefined | ModelProxyCredentialDefaultArgs> = $Result.GetResult<Prisma.$ModelProxyCredentialPayload, S>

  type ModelProxyCredentialCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxyCredentialFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxyCredentialCountAggregateInputType | true
    }

  export interface ModelProxyCredentialDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxyCredential'], meta: { name: 'ModelProxyCredential' } }
    /**
     * Find zero or one ModelProxyCredential that matches the filter.
     * @param {ModelProxyCredentialFindUniqueArgs} args - Arguments to find a ModelProxyCredential
     * @example
     * // Get one ModelProxyCredential
     * const modelProxyCredential = await prisma.modelProxyCredential.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxyCredentialFindUniqueArgs>(args: SelectSubset<T, ModelProxyCredentialFindUniqueArgs<ExtArgs>>): Prisma__ModelProxyCredentialClient<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxyCredential that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxyCredentialFindUniqueOrThrowArgs} args - Arguments to find a ModelProxyCredential
     * @example
     * // Get one ModelProxyCredential
     * const modelProxyCredential = await prisma.modelProxyCredential.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxyCredentialFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxyCredentialFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxyCredentialClient<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyCredential that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyCredentialFindFirstArgs} args - Arguments to find a ModelProxyCredential
     * @example
     * // Get one ModelProxyCredential
     * const modelProxyCredential = await prisma.modelProxyCredential.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxyCredentialFindFirstArgs>(args?: SelectSubset<T, ModelProxyCredentialFindFirstArgs<ExtArgs>>): Prisma__ModelProxyCredentialClient<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyCredential that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyCredentialFindFirstOrThrowArgs} args - Arguments to find a ModelProxyCredential
     * @example
     * // Get one ModelProxyCredential
     * const modelProxyCredential = await prisma.modelProxyCredential.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxyCredentialFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxyCredentialFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxyCredentialClient<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxyCredentials that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyCredentialFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxyCredentials
     * const modelProxyCredentials = await prisma.modelProxyCredential.findMany()
     * 
     * // Get first 10 ModelProxyCredentials
     * const modelProxyCredentials = await prisma.modelProxyCredential.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxyCredentialWithIdOnly = await prisma.modelProxyCredential.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxyCredentialFindManyArgs>(args?: SelectSubset<T, ModelProxyCredentialFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxyCredential.
     * @param {ModelProxyCredentialCreateArgs} args - Arguments to create a ModelProxyCredential.
     * @example
     * // Create one ModelProxyCredential
     * const ModelProxyCredential = await prisma.modelProxyCredential.create({
     *   data: {
     *     // ... data to create a ModelProxyCredential
     *   }
     * })
     * 
     */
    create<T extends ModelProxyCredentialCreateArgs>(args: SelectSubset<T, ModelProxyCredentialCreateArgs<ExtArgs>>): Prisma__ModelProxyCredentialClient<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxyCredentials.
     * @param {ModelProxyCredentialCreateManyArgs} args - Arguments to create many ModelProxyCredentials.
     * @example
     * // Create many ModelProxyCredentials
     * const modelProxyCredential = await prisma.modelProxyCredential.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxyCredentialCreateManyArgs>(args?: SelectSubset<T, ModelProxyCredentialCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxyCredentials and returns the data saved in the database.
     * @param {ModelProxyCredentialCreateManyAndReturnArgs} args - Arguments to create many ModelProxyCredentials.
     * @example
     * // Create many ModelProxyCredentials
     * const modelProxyCredential = await prisma.modelProxyCredential.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxyCredentials and only return the `id`
     * const modelProxyCredentialWithIdOnly = await prisma.modelProxyCredential.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxyCredentialCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxyCredentialCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxyCredential.
     * @param {ModelProxyCredentialDeleteArgs} args - Arguments to delete one ModelProxyCredential.
     * @example
     * // Delete one ModelProxyCredential
     * const ModelProxyCredential = await prisma.modelProxyCredential.delete({
     *   where: {
     *     // ... filter to delete one ModelProxyCredential
     *   }
     * })
     * 
     */
    delete<T extends ModelProxyCredentialDeleteArgs>(args: SelectSubset<T, ModelProxyCredentialDeleteArgs<ExtArgs>>): Prisma__ModelProxyCredentialClient<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxyCredential.
     * @param {ModelProxyCredentialUpdateArgs} args - Arguments to update one ModelProxyCredential.
     * @example
     * // Update one ModelProxyCredential
     * const modelProxyCredential = await prisma.modelProxyCredential.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxyCredentialUpdateArgs>(args: SelectSubset<T, ModelProxyCredentialUpdateArgs<ExtArgs>>): Prisma__ModelProxyCredentialClient<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxyCredentials.
     * @param {ModelProxyCredentialDeleteManyArgs} args - Arguments to filter ModelProxyCredentials to delete.
     * @example
     * // Delete a few ModelProxyCredentials
     * const { count } = await prisma.modelProxyCredential.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxyCredentialDeleteManyArgs>(args?: SelectSubset<T, ModelProxyCredentialDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyCredentials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyCredentialUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxyCredentials
     * const modelProxyCredential = await prisma.modelProxyCredential.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxyCredentialUpdateManyArgs>(args: SelectSubset<T, ModelProxyCredentialUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyCredentials and returns the data updated in the database.
     * @param {ModelProxyCredentialUpdateManyAndReturnArgs} args - Arguments to update many ModelProxyCredentials.
     * @example
     * // Update many ModelProxyCredentials
     * const modelProxyCredential = await prisma.modelProxyCredential.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxyCredentials and only return the `id`
     * const modelProxyCredentialWithIdOnly = await prisma.modelProxyCredential.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxyCredentialUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxyCredentialUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxyCredential.
     * @param {ModelProxyCredentialUpsertArgs} args - Arguments to update or create a ModelProxyCredential.
     * @example
     * // Update or create a ModelProxyCredential
     * const modelProxyCredential = await prisma.modelProxyCredential.upsert({
     *   create: {
     *     // ... data to create a ModelProxyCredential
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxyCredential we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxyCredentialUpsertArgs>(args: SelectSubset<T, ModelProxyCredentialUpsertArgs<ExtArgs>>): Prisma__ModelProxyCredentialClient<$Result.GetResult<Prisma.$ModelProxyCredentialPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxyCredentials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyCredentialCountArgs} args - Arguments to filter ModelProxyCredentials to count.
     * @example
     * // Count the number of ModelProxyCredentials
     * const count = await prisma.modelProxyCredential.count({
     *   where: {
     *     // ... the filter for the ModelProxyCredentials we want to count
     *   }
     * })
    **/
    count<T extends ModelProxyCredentialCountArgs>(
      args?: Subset<T, ModelProxyCredentialCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxyCredentialCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxyCredential.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyCredentialAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxyCredentialAggregateArgs>(args: Subset<T, ModelProxyCredentialAggregateArgs>): Prisma.PrismaPromise<GetModelProxyCredentialAggregateType<T>>

    /**
     * Group by ModelProxyCredential.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyCredentialGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxyCredentialGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxyCredentialGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxyCredentialGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxyCredentialGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxyCredentialGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxyCredential model
   */
  readonly fields: ModelProxyCredentialFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxyCredential.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxyCredentialClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxyCredential model
   */
  interface ModelProxyCredentialFieldRefs {
    readonly id: FieldRef<"ModelProxyCredential", 'String'>
    readonly name: FieldRef<"ModelProxyCredential", 'String'>
    readonly provider: FieldRef<"ModelProxyCredential", 'String'>
    readonly baseUrl: FieldRef<"ModelProxyCredential", 'String'>
    readonly apiKey: FieldRef<"ModelProxyCredential", 'String'>
    readonly secretRef: FieldRef<"ModelProxyCredential", 'String'>
    readonly createdAt: FieldRef<"ModelProxyCredential", 'DateTime'>
    readonly updatedAt: FieldRef<"ModelProxyCredential", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxyCredential findUnique
   */
  export type ModelProxyCredentialFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyCredential to fetch.
     */
    where: ModelProxyCredentialWhereUniqueInput
  }

  /**
   * ModelProxyCredential findUniqueOrThrow
   */
  export type ModelProxyCredentialFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyCredential to fetch.
     */
    where: ModelProxyCredentialWhereUniqueInput
  }

  /**
   * ModelProxyCredential findFirst
   */
  export type ModelProxyCredentialFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyCredential to fetch.
     */
    where?: ModelProxyCredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyCredentials to fetch.
     */
    orderBy?: ModelProxyCredentialOrderByWithRelationInput | ModelProxyCredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyCredentials.
     */
    cursor?: ModelProxyCredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyCredentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyCredentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyCredentials.
     */
    distinct?: ModelProxyCredentialScalarFieldEnum | ModelProxyCredentialScalarFieldEnum[]
  }

  /**
   * ModelProxyCredential findFirstOrThrow
   */
  export type ModelProxyCredentialFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyCredential to fetch.
     */
    where?: ModelProxyCredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyCredentials to fetch.
     */
    orderBy?: ModelProxyCredentialOrderByWithRelationInput | ModelProxyCredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyCredentials.
     */
    cursor?: ModelProxyCredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyCredentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyCredentials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyCredentials.
     */
    distinct?: ModelProxyCredentialScalarFieldEnum | ModelProxyCredentialScalarFieldEnum[]
  }

  /**
   * ModelProxyCredential findMany
   */
  export type ModelProxyCredentialFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyCredentials to fetch.
     */
    where?: ModelProxyCredentialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyCredentials to fetch.
     */
    orderBy?: ModelProxyCredentialOrderByWithRelationInput | ModelProxyCredentialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxyCredentials.
     */
    cursor?: ModelProxyCredentialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyCredentials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyCredentials.
     */
    skip?: number
    distinct?: ModelProxyCredentialScalarFieldEnum | ModelProxyCredentialScalarFieldEnum[]
  }

  /**
   * ModelProxyCredential create
   */
  export type ModelProxyCredentialCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * The data needed to create a ModelProxyCredential.
     */
    data: XOR<ModelProxyCredentialCreateInput, ModelProxyCredentialUncheckedCreateInput>
  }

  /**
   * ModelProxyCredential createMany
   */
  export type ModelProxyCredentialCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxyCredentials.
     */
    data: ModelProxyCredentialCreateManyInput | ModelProxyCredentialCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyCredential createManyAndReturn
   */
  export type ModelProxyCredentialCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxyCredentials.
     */
    data: ModelProxyCredentialCreateManyInput | ModelProxyCredentialCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyCredential update
   */
  export type ModelProxyCredentialUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * The data needed to update a ModelProxyCredential.
     */
    data: XOR<ModelProxyCredentialUpdateInput, ModelProxyCredentialUncheckedUpdateInput>
    /**
     * Choose, which ModelProxyCredential to update.
     */
    where: ModelProxyCredentialWhereUniqueInput
  }

  /**
   * ModelProxyCredential updateMany
   */
  export type ModelProxyCredentialUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxyCredentials.
     */
    data: XOR<ModelProxyCredentialUpdateManyMutationInput, ModelProxyCredentialUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyCredentials to update
     */
    where?: ModelProxyCredentialWhereInput
    /**
     * Limit how many ModelProxyCredentials to update.
     */
    limit?: number
  }

  /**
   * ModelProxyCredential updateManyAndReturn
   */
  export type ModelProxyCredentialUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxyCredentials.
     */
    data: XOR<ModelProxyCredentialUpdateManyMutationInput, ModelProxyCredentialUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyCredentials to update
     */
    where?: ModelProxyCredentialWhereInput
    /**
     * Limit how many ModelProxyCredentials to update.
     */
    limit?: number
  }

  /**
   * ModelProxyCredential upsert
   */
  export type ModelProxyCredentialUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * The filter to search for the ModelProxyCredential to update in case it exists.
     */
    where: ModelProxyCredentialWhereUniqueInput
    /**
     * In case the ModelProxyCredential found by the `where` argument doesn't exist, create a new ModelProxyCredential with this data.
     */
    create: XOR<ModelProxyCredentialCreateInput, ModelProxyCredentialUncheckedCreateInput>
    /**
     * In case the ModelProxyCredential was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxyCredentialUpdateInput, ModelProxyCredentialUncheckedUpdateInput>
  }

  /**
   * ModelProxyCredential delete
   */
  export type ModelProxyCredentialDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
    /**
     * Filter which ModelProxyCredential to delete.
     */
    where: ModelProxyCredentialWhereUniqueInput
  }

  /**
   * ModelProxyCredential deleteMany
   */
  export type ModelProxyCredentialDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyCredentials to delete
     */
    where?: ModelProxyCredentialWhereInput
    /**
     * Limit how many ModelProxyCredentials to delete.
     */
    limit?: number
  }

  /**
   * ModelProxyCredential without action
   */
  export type ModelProxyCredentialDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyCredential
     */
    select?: ModelProxyCredentialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyCredential
     */
    omit?: ModelProxyCredentialOmit<ExtArgs> | null
  }


  /**
   * Model ModelProxyApiKey
   */

  export type AggregateModelProxyApiKey = {
    _count: ModelProxyApiKeyCountAggregateOutputType | null
    _min: ModelProxyApiKeyMinAggregateOutputType | null
    _max: ModelProxyApiKeyMaxAggregateOutputType | null
  }

  export type ModelProxyApiKeyMinAggregateOutputType = {
    id: string | null
    label: string | null
    keyHash: string | null
    enabled: boolean | null
    lastUsedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxyApiKeyMaxAggregateOutputType = {
    id: string | null
    label: string | null
    keyHash: string | null
    enabled: boolean | null
    lastUsedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxyApiKeyCountAggregateOutputType = {
    id: number
    label: number
    keyHash: number
    enabled: number
    lastUsedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ModelProxyApiKeyMinAggregateInputType = {
    id?: true
    label?: true
    keyHash?: true
    enabled?: true
    lastUsedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxyApiKeyMaxAggregateInputType = {
    id?: true
    label?: true
    keyHash?: true
    enabled?: true
    lastUsedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxyApiKeyCountAggregateInputType = {
    id?: true
    label?: true
    keyHash?: true
    enabled?: true
    lastUsedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ModelProxyApiKeyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyApiKey to aggregate.
     */
    where?: ModelProxyApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyApiKeys to fetch.
     */
    orderBy?: ModelProxyApiKeyOrderByWithRelationInput | ModelProxyApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxyApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxyApiKeys
    **/
    _count?: true | ModelProxyApiKeyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxyApiKeyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxyApiKeyMaxAggregateInputType
  }

  export type GetModelProxyApiKeyAggregateType<T extends ModelProxyApiKeyAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxyApiKey]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxyApiKey[P]>
      : GetScalarType<T[P], AggregateModelProxyApiKey[P]>
  }




  export type ModelProxyApiKeyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyApiKeyWhereInput
    orderBy?: ModelProxyApiKeyOrderByWithAggregationInput | ModelProxyApiKeyOrderByWithAggregationInput[]
    by: ModelProxyApiKeyScalarFieldEnum[] | ModelProxyApiKeyScalarFieldEnum
    having?: ModelProxyApiKeyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxyApiKeyCountAggregateInputType | true
    _min?: ModelProxyApiKeyMinAggregateInputType
    _max?: ModelProxyApiKeyMaxAggregateInputType
  }

  export type ModelProxyApiKeyGroupByOutputType = {
    id: string
    label: string
    keyHash: string
    enabled: boolean
    lastUsedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ModelProxyApiKeyCountAggregateOutputType | null
    _min: ModelProxyApiKeyMinAggregateOutputType | null
    _max: ModelProxyApiKeyMaxAggregateOutputType | null
  }

  type GetModelProxyApiKeyGroupByPayload<T extends ModelProxyApiKeyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxyApiKeyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxyApiKeyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxyApiKeyGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxyApiKeyGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxyApiKeySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    label?: boolean
    keyHash?: boolean
    enabled?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyApiKey"]>

  export type ModelProxyApiKeySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    label?: boolean
    keyHash?: boolean
    enabled?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyApiKey"]>

  export type ModelProxyApiKeySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    label?: boolean
    keyHash?: boolean
    enabled?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyApiKey"]>

  export type ModelProxyApiKeySelectScalar = {
    id?: boolean
    label?: boolean
    keyHash?: boolean
    enabled?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ModelProxyApiKeyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "label" | "keyHash" | "enabled" | "lastUsedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["modelProxyApiKey"]>

  export type $ModelProxyApiKeyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxyApiKey"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      label: string
      keyHash: string
      enabled: boolean
      lastUsedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["modelProxyApiKey"]>
    composites: {}
  }

  type ModelProxyApiKeyGetPayload<S extends boolean | null | undefined | ModelProxyApiKeyDefaultArgs> = $Result.GetResult<Prisma.$ModelProxyApiKeyPayload, S>

  type ModelProxyApiKeyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxyApiKeyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxyApiKeyCountAggregateInputType | true
    }

  export interface ModelProxyApiKeyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxyApiKey'], meta: { name: 'ModelProxyApiKey' } }
    /**
     * Find zero or one ModelProxyApiKey that matches the filter.
     * @param {ModelProxyApiKeyFindUniqueArgs} args - Arguments to find a ModelProxyApiKey
     * @example
     * // Get one ModelProxyApiKey
     * const modelProxyApiKey = await prisma.modelProxyApiKey.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxyApiKeyFindUniqueArgs>(args: SelectSubset<T, ModelProxyApiKeyFindUniqueArgs<ExtArgs>>): Prisma__ModelProxyApiKeyClient<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxyApiKey that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxyApiKeyFindUniqueOrThrowArgs} args - Arguments to find a ModelProxyApiKey
     * @example
     * // Get one ModelProxyApiKey
     * const modelProxyApiKey = await prisma.modelProxyApiKey.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxyApiKeyFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxyApiKeyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxyApiKeyClient<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyApiKey that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyApiKeyFindFirstArgs} args - Arguments to find a ModelProxyApiKey
     * @example
     * // Get one ModelProxyApiKey
     * const modelProxyApiKey = await prisma.modelProxyApiKey.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxyApiKeyFindFirstArgs>(args?: SelectSubset<T, ModelProxyApiKeyFindFirstArgs<ExtArgs>>): Prisma__ModelProxyApiKeyClient<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyApiKey that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyApiKeyFindFirstOrThrowArgs} args - Arguments to find a ModelProxyApiKey
     * @example
     * // Get one ModelProxyApiKey
     * const modelProxyApiKey = await prisma.modelProxyApiKey.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxyApiKeyFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxyApiKeyFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxyApiKeyClient<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxyApiKeys that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyApiKeyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxyApiKeys
     * const modelProxyApiKeys = await prisma.modelProxyApiKey.findMany()
     * 
     * // Get first 10 ModelProxyApiKeys
     * const modelProxyApiKeys = await prisma.modelProxyApiKey.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxyApiKeyWithIdOnly = await prisma.modelProxyApiKey.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxyApiKeyFindManyArgs>(args?: SelectSubset<T, ModelProxyApiKeyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxyApiKey.
     * @param {ModelProxyApiKeyCreateArgs} args - Arguments to create a ModelProxyApiKey.
     * @example
     * // Create one ModelProxyApiKey
     * const ModelProxyApiKey = await prisma.modelProxyApiKey.create({
     *   data: {
     *     // ... data to create a ModelProxyApiKey
     *   }
     * })
     * 
     */
    create<T extends ModelProxyApiKeyCreateArgs>(args: SelectSubset<T, ModelProxyApiKeyCreateArgs<ExtArgs>>): Prisma__ModelProxyApiKeyClient<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxyApiKeys.
     * @param {ModelProxyApiKeyCreateManyArgs} args - Arguments to create many ModelProxyApiKeys.
     * @example
     * // Create many ModelProxyApiKeys
     * const modelProxyApiKey = await prisma.modelProxyApiKey.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxyApiKeyCreateManyArgs>(args?: SelectSubset<T, ModelProxyApiKeyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxyApiKeys and returns the data saved in the database.
     * @param {ModelProxyApiKeyCreateManyAndReturnArgs} args - Arguments to create many ModelProxyApiKeys.
     * @example
     * // Create many ModelProxyApiKeys
     * const modelProxyApiKey = await prisma.modelProxyApiKey.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxyApiKeys and only return the `id`
     * const modelProxyApiKeyWithIdOnly = await prisma.modelProxyApiKey.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxyApiKeyCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxyApiKeyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxyApiKey.
     * @param {ModelProxyApiKeyDeleteArgs} args - Arguments to delete one ModelProxyApiKey.
     * @example
     * // Delete one ModelProxyApiKey
     * const ModelProxyApiKey = await prisma.modelProxyApiKey.delete({
     *   where: {
     *     // ... filter to delete one ModelProxyApiKey
     *   }
     * })
     * 
     */
    delete<T extends ModelProxyApiKeyDeleteArgs>(args: SelectSubset<T, ModelProxyApiKeyDeleteArgs<ExtArgs>>): Prisma__ModelProxyApiKeyClient<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxyApiKey.
     * @param {ModelProxyApiKeyUpdateArgs} args - Arguments to update one ModelProxyApiKey.
     * @example
     * // Update one ModelProxyApiKey
     * const modelProxyApiKey = await prisma.modelProxyApiKey.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxyApiKeyUpdateArgs>(args: SelectSubset<T, ModelProxyApiKeyUpdateArgs<ExtArgs>>): Prisma__ModelProxyApiKeyClient<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxyApiKeys.
     * @param {ModelProxyApiKeyDeleteManyArgs} args - Arguments to filter ModelProxyApiKeys to delete.
     * @example
     * // Delete a few ModelProxyApiKeys
     * const { count } = await prisma.modelProxyApiKey.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxyApiKeyDeleteManyArgs>(args?: SelectSubset<T, ModelProxyApiKeyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyApiKeys.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyApiKeyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxyApiKeys
     * const modelProxyApiKey = await prisma.modelProxyApiKey.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxyApiKeyUpdateManyArgs>(args: SelectSubset<T, ModelProxyApiKeyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyApiKeys and returns the data updated in the database.
     * @param {ModelProxyApiKeyUpdateManyAndReturnArgs} args - Arguments to update many ModelProxyApiKeys.
     * @example
     * // Update many ModelProxyApiKeys
     * const modelProxyApiKey = await prisma.modelProxyApiKey.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxyApiKeys and only return the `id`
     * const modelProxyApiKeyWithIdOnly = await prisma.modelProxyApiKey.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxyApiKeyUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxyApiKeyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxyApiKey.
     * @param {ModelProxyApiKeyUpsertArgs} args - Arguments to update or create a ModelProxyApiKey.
     * @example
     * // Update or create a ModelProxyApiKey
     * const modelProxyApiKey = await prisma.modelProxyApiKey.upsert({
     *   create: {
     *     // ... data to create a ModelProxyApiKey
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxyApiKey we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxyApiKeyUpsertArgs>(args: SelectSubset<T, ModelProxyApiKeyUpsertArgs<ExtArgs>>): Prisma__ModelProxyApiKeyClient<$Result.GetResult<Prisma.$ModelProxyApiKeyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxyApiKeys.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyApiKeyCountArgs} args - Arguments to filter ModelProxyApiKeys to count.
     * @example
     * // Count the number of ModelProxyApiKeys
     * const count = await prisma.modelProxyApiKey.count({
     *   where: {
     *     // ... the filter for the ModelProxyApiKeys we want to count
     *   }
     * })
    **/
    count<T extends ModelProxyApiKeyCountArgs>(
      args?: Subset<T, ModelProxyApiKeyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxyApiKeyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxyApiKey.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyApiKeyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxyApiKeyAggregateArgs>(args: Subset<T, ModelProxyApiKeyAggregateArgs>): Prisma.PrismaPromise<GetModelProxyApiKeyAggregateType<T>>

    /**
     * Group by ModelProxyApiKey.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyApiKeyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxyApiKeyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxyApiKeyGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxyApiKeyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxyApiKeyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxyApiKeyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxyApiKey model
   */
  readonly fields: ModelProxyApiKeyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxyApiKey.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxyApiKeyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxyApiKey model
   */
  interface ModelProxyApiKeyFieldRefs {
    readonly id: FieldRef<"ModelProxyApiKey", 'String'>
    readonly label: FieldRef<"ModelProxyApiKey", 'String'>
    readonly keyHash: FieldRef<"ModelProxyApiKey", 'String'>
    readonly enabled: FieldRef<"ModelProxyApiKey", 'Boolean'>
    readonly lastUsedAt: FieldRef<"ModelProxyApiKey", 'DateTime'>
    readonly createdAt: FieldRef<"ModelProxyApiKey", 'DateTime'>
    readonly updatedAt: FieldRef<"ModelProxyApiKey", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxyApiKey findUnique
   */
  export type ModelProxyApiKeyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyApiKey to fetch.
     */
    where: ModelProxyApiKeyWhereUniqueInput
  }

  /**
   * ModelProxyApiKey findUniqueOrThrow
   */
  export type ModelProxyApiKeyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyApiKey to fetch.
     */
    where: ModelProxyApiKeyWhereUniqueInput
  }

  /**
   * ModelProxyApiKey findFirst
   */
  export type ModelProxyApiKeyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyApiKey to fetch.
     */
    where?: ModelProxyApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyApiKeys to fetch.
     */
    orderBy?: ModelProxyApiKeyOrderByWithRelationInput | ModelProxyApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyApiKeys.
     */
    cursor?: ModelProxyApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyApiKeys.
     */
    distinct?: ModelProxyApiKeyScalarFieldEnum | ModelProxyApiKeyScalarFieldEnum[]
  }

  /**
   * ModelProxyApiKey findFirstOrThrow
   */
  export type ModelProxyApiKeyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyApiKey to fetch.
     */
    where?: ModelProxyApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyApiKeys to fetch.
     */
    orderBy?: ModelProxyApiKeyOrderByWithRelationInput | ModelProxyApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyApiKeys.
     */
    cursor?: ModelProxyApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyApiKeys.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyApiKeys.
     */
    distinct?: ModelProxyApiKeyScalarFieldEnum | ModelProxyApiKeyScalarFieldEnum[]
  }

  /**
   * ModelProxyApiKey findMany
   */
  export type ModelProxyApiKeyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyApiKeys to fetch.
     */
    where?: ModelProxyApiKeyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyApiKeys to fetch.
     */
    orderBy?: ModelProxyApiKeyOrderByWithRelationInput | ModelProxyApiKeyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxyApiKeys.
     */
    cursor?: ModelProxyApiKeyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyApiKeys from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyApiKeys.
     */
    skip?: number
    distinct?: ModelProxyApiKeyScalarFieldEnum | ModelProxyApiKeyScalarFieldEnum[]
  }

  /**
   * ModelProxyApiKey create
   */
  export type ModelProxyApiKeyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * The data needed to create a ModelProxyApiKey.
     */
    data: XOR<ModelProxyApiKeyCreateInput, ModelProxyApiKeyUncheckedCreateInput>
  }

  /**
   * ModelProxyApiKey createMany
   */
  export type ModelProxyApiKeyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxyApiKeys.
     */
    data: ModelProxyApiKeyCreateManyInput | ModelProxyApiKeyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyApiKey createManyAndReturn
   */
  export type ModelProxyApiKeyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxyApiKeys.
     */
    data: ModelProxyApiKeyCreateManyInput | ModelProxyApiKeyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyApiKey update
   */
  export type ModelProxyApiKeyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * The data needed to update a ModelProxyApiKey.
     */
    data: XOR<ModelProxyApiKeyUpdateInput, ModelProxyApiKeyUncheckedUpdateInput>
    /**
     * Choose, which ModelProxyApiKey to update.
     */
    where: ModelProxyApiKeyWhereUniqueInput
  }

  /**
   * ModelProxyApiKey updateMany
   */
  export type ModelProxyApiKeyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxyApiKeys.
     */
    data: XOR<ModelProxyApiKeyUpdateManyMutationInput, ModelProxyApiKeyUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyApiKeys to update
     */
    where?: ModelProxyApiKeyWhereInput
    /**
     * Limit how many ModelProxyApiKeys to update.
     */
    limit?: number
  }

  /**
   * ModelProxyApiKey updateManyAndReturn
   */
  export type ModelProxyApiKeyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxyApiKeys.
     */
    data: XOR<ModelProxyApiKeyUpdateManyMutationInput, ModelProxyApiKeyUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyApiKeys to update
     */
    where?: ModelProxyApiKeyWhereInput
    /**
     * Limit how many ModelProxyApiKeys to update.
     */
    limit?: number
  }

  /**
   * ModelProxyApiKey upsert
   */
  export type ModelProxyApiKeyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * The filter to search for the ModelProxyApiKey to update in case it exists.
     */
    where: ModelProxyApiKeyWhereUniqueInput
    /**
     * In case the ModelProxyApiKey found by the `where` argument doesn't exist, create a new ModelProxyApiKey with this data.
     */
    create: XOR<ModelProxyApiKeyCreateInput, ModelProxyApiKeyUncheckedCreateInput>
    /**
     * In case the ModelProxyApiKey was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxyApiKeyUpdateInput, ModelProxyApiKeyUncheckedUpdateInput>
  }

  /**
   * ModelProxyApiKey delete
   */
  export type ModelProxyApiKeyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
    /**
     * Filter which ModelProxyApiKey to delete.
     */
    where: ModelProxyApiKeyWhereUniqueInput
  }

  /**
   * ModelProxyApiKey deleteMany
   */
  export type ModelProxyApiKeyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyApiKeys to delete
     */
    where?: ModelProxyApiKeyWhereInput
    /**
     * Limit how many ModelProxyApiKeys to delete.
     */
    limit?: number
  }

  /**
   * ModelProxyApiKey without action
   */
  export type ModelProxyApiKeyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyApiKey
     */
    select?: ModelProxyApiKeySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyApiKey
     */
    omit?: ModelProxyApiKeyOmit<ExtArgs> | null
  }


  /**
   * Model ModelProxySetting
   */

  export type AggregateModelProxySetting = {
    _count: ModelProxySettingCountAggregateOutputType | null
    _min: ModelProxySettingMinAggregateOutputType | null
    _max: ModelProxySettingMaxAggregateOutputType | null
  }

  export type ModelProxySettingMinAggregateOutputType = {
    id: string | null
    key: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxySettingMaxAggregateOutputType = {
    id: string | null
    key: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxySettingCountAggregateOutputType = {
    id: number
    key: number
    value: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ModelProxySettingMinAggregateInputType = {
    id?: true
    key?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxySettingMaxAggregateInputType = {
    id?: true
    key?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxySettingCountAggregateInputType = {
    id?: true
    key?: true
    value?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ModelProxySettingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxySetting to aggregate.
     */
    where?: ModelProxySettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxySettings to fetch.
     */
    orderBy?: ModelProxySettingOrderByWithRelationInput | ModelProxySettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxySettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxySettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxySettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxySettings
    **/
    _count?: true | ModelProxySettingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxySettingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxySettingMaxAggregateInputType
  }

  export type GetModelProxySettingAggregateType<T extends ModelProxySettingAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxySetting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxySetting[P]>
      : GetScalarType<T[P], AggregateModelProxySetting[P]>
  }




  export type ModelProxySettingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxySettingWhereInput
    orderBy?: ModelProxySettingOrderByWithAggregationInput | ModelProxySettingOrderByWithAggregationInput[]
    by: ModelProxySettingScalarFieldEnum[] | ModelProxySettingScalarFieldEnum
    having?: ModelProxySettingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxySettingCountAggregateInputType | true
    _min?: ModelProxySettingMinAggregateInputType
    _max?: ModelProxySettingMaxAggregateInputType
  }

  export type ModelProxySettingGroupByOutputType = {
    id: string
    key: string
    value: JsonValue
    createdAt: Date
    updatedAt: Date
    _count: ModelProxySettingCountAggregateOutputType | null
    _min: ModelProxySettingMinAggregateOutputType | null
    _max: ModelProxySettingMaxAggregateOutputType | null
  }

  type GetModelProxySettingGroupByPayload<T extends ModelProxySettingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxySettingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxySettingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxySettingGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxySettingGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxySettingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    value?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxySetting"]>

  export type ModelProxySettingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    value?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxySetting"]>

  export type ModelProxySettingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    key?: boolean
    value?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxySetting"]>

  export type ModelProxySettingSelectScalar = {
    id?: boolean
    key?: boolean
    value?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ModelProxySettingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "key" | "value" | "createdAt" | "updatedAt", ExtArgs["result"]["modelProxySetting"]>

  export type $ModelProxySettingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxySetting"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      key: string
      value: Prisma.JsonValue
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["modelProxySetting"]>
    composites: {}
  }

  type ModelProxySettingGetPayload<S extends boolean | null | undefined | ModelProxySettingDefaultArgs> = $Result.GetResult<Prisma.$ModelProxySettingPayload, S>

  type ModelProxySettingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxySettingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxySettingCountAggregateInputType | true
    }

  export interface ModelProxySettingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxySetting'], meta: { name: 'ModelProxySetting' } }
    /**
     * Find zero or one ModelProxySetting that matches the filter.
     * @param {ModelProxySettingFindUniqueArgs} args - Arguments to find a ModelProxySetting
     * @example
     * // Get one ModelProxySetting
     * const modelProxySetting = await prisma.modelProxySetting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxySettingFindUniqueArgs>(args: SelectSubset<T, ModelProxySettingFindUniqueArgs<ExtArgs>>): Prisma__ModelProxySettingClient<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxySetting that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxySettingFindUniqueOrThrowArgs} args - Arguments to find a ModelProxySetting
     * @example
     * // Get one ModelProxySetting
     * const modelProxySetting = await prisma.modelProxySetting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxySettingFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxySettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxySettingClient<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxySetting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxySettingFindFirstArgs} args - Arguments to find a ModelProxySetting
     * @example
     * // Get one ModelProxySetting
     * const modelProxySetting = await prisma.modelProxySetting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxySettingFindFirstArgs>(args?: SelectSubset<T, ModelProxySettingFindFirstArgs<ExtArgs>>): Prisma__ModelProxySettingClient<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxySetting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxySettingFindFirstOrThrowArgs} args - Arguments to find a ModelProxySetting
     * @example
     * // Get one ModelProxySetting
     * const modelProxySetting = await prisma.modelProxySetting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxySettingFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxySettingFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxySettingClient<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxySettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxySettingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxySettings
     * const modelProxySettings = await prisma.modelProxySetting.findMany()
     * 
     * // Get first 10 ModelProxySettings
     * const modelProxySettings = await prisma.modelProxySetting.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxySettingWithIdOnly = await prisma.modelProxySetting.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxySettingFindManyArgs>(args?: SelectSubset<T, ModelProxySettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxySetting.
     * @param {ModelProxySettingCreateArgs} args - Arguments to create a ModelProxySetting.
     * @example
     * // Create one ModelProxySetting
     * const ModelProxySetting = await prisma.modelProxySetting.create({
     *   data: {
     *     // ... data to create a ModelProxySetting
     *   }
     * })
     * 
     */
    create<T extends ModelProxySettingCreateArgs>(args: SelectSubset<T, ModelProxySettingCreateArgs<ExtArgs>>): Prisma__ModelProxySettingClient<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxySettings.
     * @param {ModelProxySettingCreateManyArgs} args - Arguments to create many ModelProxySettings.
     * @example
     * // Create many ModelProxySettings
     * const modelProxySetting = await prisma.modelProxySetting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxySettingCreateManyArgs>(args?: SelectSubset<T, ModelProxySettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxySettings and returns the data saved in the database.
     * @param {ModelProxySettingCreateManyAndReturnArgs} args - Arguments to create many ModelProxySettings.
     * @example
     * // Create many ModelProxySettings
     * const modelProxySetting = await prisma.modelProxySetting.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxySettings and only return the `id`
     * const modelProxySettingWithIdOnly = await prisma.modelProxySetting.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxySettingCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxySettingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxySetting.
     * @param {ModelProxySettingDeleteArgs} args - Arguments to delete one ModelProxySetting.
     * @example
     * // Delete one ModelProxySetting
     * const ModelProxySetting = await prisma.modelProxySetting.delete({
     *   where: {
     *     // ... filter to delete one ModelProxySetting
     *   }
     * })
     * 
     */
    delete<T extends ModelProxySettingDeleteArgs>(args: SelectSubset<T, ModelProxySettingDeleteArgs<ExtArgs>>): Prisma__ModelProxySettingClient<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxySetting.
     * @param {ModelProxySettingUpdateArgs} args - Arguments to update one ModelProxySetting.
     * @example
     * // Update one ModelProxySetting
     * const modelProxySetting = await prisma.modelProxySetting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxySettingUpdateArgs>(args: SelectSubset<T, ModelProxySettingUpdateArgs<ExtArgs>>): Prisma__ModelProxySettingClient<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxySettings.
     * @param {ModelProxySettingDeleteManyArgs} args - Arguments to filter ModelProxySettings to delete.
     * @example
     * // Delete a few ModelProxySettings
     * const { count } = await prisma.modelProxySetting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxySettingDeleteManyArgs>(args?: SelectSubset<T, ModelProxySettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxySettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxySettingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxySettings
     * const modelProxySetting = await prisma.modelProxySetting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxySettingUpdateManyArgs>(args: SelectSubset<T, ModelProxySettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxySettings and returns the data updated in the database.
     * @param {ModelProxySettingUpdateManyAndReturnArgs} args - Arguments to update many ModelProxySettings.
     * @example
     * // Update many ModelProxySettings
     * const modelProxySetting = await prisma.modelProxySetting.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxySettings and only return the `id`
     * const modelProxySettingWithIdOnly = await prisma.modelProxySetting.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxySettingUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxySettingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxySetting.
     * @param {ModelProxySettingUpsertArgs} args - Arguments to update or create a ModelProxySetting.
     * @example
     * // Update or create a ModelProxySetting
     * const modelProxySetting = await prisma.modelProxySetting.upsert({
     *   create: {
     *     // ... data to create a ModelProxySetting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxySetting we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxySettingUpsertArgs>(args: SelectSubset<T, ModelProxySettingUpsertArgs<ExtArgs>>): Prisma__ModelProxySettingClient<$Result.GetResult<Prisma.$ModelProxySettingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxySettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxySettingCountArgs} args - Arguments to filter ModelProxySettings to count.
     * @example
     * // Count the number of ModelProxySettings
     * const count = await prisma.modelProxySetting.count({
     *   where: {
     *     // ... the filter for the ModelProxySettings we want to count
     *   }
     * })
    **/
    count<T extends ModelProxySettingCountArgs>(
      args?: Subset<T, ModelProxySettingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxySettingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxySetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxySettingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxySettingAggregateArgs>(args: Subset<T, ModelProxySettingAggregateArgs>): Prisma.PrismaPromise<GetModelProxySettingAggregateType<T>>

    /**
     * Group by ModelProxySetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxySettingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxySettingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxySettingGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxySettingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxySettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxySettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxySetting model
   */
  readonly fields: ModelProxySettingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxySetting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxySettingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxySetting model
   */
  interface ModelProxySettingFieldRefs {
    readonly id: FieldRef<"ModelProxySetting", 'String'>
    readonly key: FieldRef<"ModelProxySetting", 'String'>
    readonly value: FieldRef<"ModelProxySetting", 'Json'>
    readonly createdAt: FieldRef<"ModelProxySetting", 'DateTime'>
    readonly updatedAt: FieldRef<"ModelProxySetting", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxySetting findUnique
   */
  export type ModelProxySettingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxySetting to fetch.
     */
    where: ModelProxySettingWhereUniqueInput
  }

  /**
   * ModelProxySetting findUniqueOrThrow
   */
  export type ModelProxySettingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxySetting to fetch.
     */
    where: ModelProxySettingWhereUniqueInput
  }

  /**
   * ModelProxySetting findFirst
   */
  export type ModelProxySettingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxySetting to fetch.
     */
    where?: ModelProxySettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxySettings to fetch.
     */
    orderBy?: ModelProxySettingOrderByWithRelationInput | ModelProxySettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxySettings.
     */
    cursor?: ModelProxySettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxySettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxySettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxySettings.
     */
    distinct?: ModelProxySettingScalarFieldEnum | ModelProxySettingScalarFieldEnum[]
  }

  /**
   * ModelProxySetting findFirstOrThrow
   */
  export type ModelProxySettingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxySetting to fetch.
     */
    where?: ModelProxySettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxySettings to fetch.
     */
    orderBy?: ModelProxySettingOrderByWithRelationInput | ModelProxySettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxySettings.
     */
    cursor?: ModelProxySettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxySettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxySettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxySettings.
     */
    distinct?: ModelProxySettingScalarFieldEnum | ModelProxySettingScalarFieldEnum[]
  }

  /**
   * ModelProxySetting findMany
   */
  export type ModelProxySettingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxySettings to fetch.
     */
    where?: ModelProxySettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxySettings to fetch.
     */
    orderBy?: ModelProxySettingOrderByWithRelationInput | ModelProxySettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxySettings.
     */
    cursor?: ModelProxySettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxySettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxySettings.
     */
    skip?: number
    distinct?: ModelProxySettingScalarFieldEnum | ModelProxySettingScalarFieldEnum[]
  }

  /**
   * ModelProxySetting create
   */
  export type ModelProxySettingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * The data needed to create a ModelProxySetting.
     */
    data: XOR<ModelProxySettingCreateInput, ModelProxySettingUncheckedCreateInput>
  }

  /**
   * ModelProxySetting createMany
   */
  export type ModelProxySettingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxySettings.
     */
    data: ModelProxySettingCreateManyInput | ModelProxySettingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxySetting createManyAndReturn
   */
  export type ModelProxySettingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxySettings.
     */
    data: ModelProxySettingCreateManyInput | ModelProxySettingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxySetting update
   */
  export type ModelProxySettingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * The data needed to update a ModelProxySetting.
     */
    data: XOR<ModelProxySettingUpdateInput, ModelProxySettingUncheckedUpdateInput>
    /**
     * Choose, which ModelProxySetting to update.
     */
    where: ModelProxySettingWhereUniqueInput
  }

  /**
   * ModelProxySetting updateMany
   */
  export type ModelProxySettingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxySettings.
     */
    data: XOR<ModelProxySettingUpdateManyMutationInput, ModelProxySettingUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxySettings to update
     */
    where?: ModelProxySettingWhereInput
    /**
     * Limit how many ModelProxySettings to update.
     */
    limit?: number
  }

  /**
   * ModelProxySetting updateManyAndReturn
   */
  export type ModelProxySettingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxySettings.
     */
    data: XOR<ModelProxySettingUpdateManyMutationInput, ModelProxySettingUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxySettings to update
     */
    where?: ModelProxySettingWhereInput
    /**
     * Limit how many ModelProxySettings to update.
     */
    limit?: number
  }

  /**
   * ModelProxySetting upsert
   */
  export type ModelProxySettingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * The filter to search for the ModelProxySetting to update in case it exists.
     */
    where: ModelProxySettingWhereUniqueInput
    /**
     * In case the ModelProxySetting found by the `where` argument doesn't exist, create a new ModelProxySetting with this data.
     */
    create: XOR<ModelProxySettingCreateInput, ModelProxySettingUncheckedCreateInput>
    /**
     * In case the ModelProxySetting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxySettingUpdateInput, ModelProxySettingUncheckedUpdateInput>
  }

  /**
   * ModelProxySetting delete
   */
  export type ModelProxySettingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
    /**
     * Filter which ModelProxySetting to delete.
     */
    where: ModelProxySettingWhereUniqueInput
  }

  /**
   * ModelProxySetting deleteMany
   */
  export type ModelProxySettingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxySettings to delete
     */
    where?: ModelProxySettingWhereInput
    /**
     * Limit how many ModelProxySettings to delete.
     */
    limit?: number
  }

  /**
   * ModelProxySetting without action
   */
  export type ModelProxySettingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxySetting
     */
    select?: ModelProxySettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxySetting
     */
    omit?: ModelProxySettingOmit<ExtArgs> | null
  }


  /**
   * Model ModelProxyAlias
   */

  export type AggregateModelProxyAlias = {
    _count: ModelProxyAliasCountAggregateOutputType | null
    _min: ModelProxyAliasMinAggregateOutputType | null
    _max: ModelProxyAliasMaxAggregateOutputType | null
  }

  export type ModelProxyAliasMinAggregateOutputType = {
    id: string | null
    alias: string | null
    targetModel: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxyAliasMaxAggregateOutputType = {
    id: string | null
    alias: string | null
    targetModel: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ModelProxyAliasCountAggregateOutputType = {
    id: number
    alias: number
    targetModel: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ModelProxyAliasMinAggregateInputType = {
    id?: true
    alias?: true
    targetModel?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxyAliasMaxAggregateInputType = {
    id?: true
    alias?: true
    targetModel?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ModelProxyAliasCountAggregateInputType = {
    id?: true
    alias?: true
    targetModel?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ModelProxyAliasAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyAlias to aggregate.
     */
    where?: ModelProxyAliasWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyAliases to fetch.
     */
    orderBy?: ModelProxyAliasOrderByWithRelationInput | ModelProxyAliasOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxyAliasWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyAliases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyAliases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxyAliases
    **/
    _count?: true | ModelProxyAliasCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxyAliasMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxyAliasMaxAggregateInputType
  }

  export type GetModelProxyAliasAggregateType<T extends ModelProxyAliasAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxyAlias]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxyAlias[P]>
      : GetScalarType<T[P], AggregateModelProxyAlias[P]>
  }




  export type ModelProxyAliasGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyAliasWhereInput
    orderBy?: ModelProxyAliasOrderByWithAggregationInput | ModelProxyAliasOrderByWithAggregationInput[]
    by: ModelProxyAliasScalarFieldEnum[] | ModelProxyAliasScalarFieldEnum
    having?: ModelProxyAliasScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxyAliasCountAggregateInputType | true
    _min?: ModelProxyAliasMinAggregateInputType
    _max?: ModelProxyAliasMaxAggregateInputType
  }

  export type ModelProxyAliasGroupByOutputType = {
    id: string
    alias: string
    targetModel: string
    createdAt: Date
    updatedAt: Date
    _count: ModelProxyAliasCountAggregateOutputType | null
    _min: ModelProxyAliasMinAggregateOutputType | null
    _max: ModelProxyAliasMaxAggregateOutputType | null
  }

  type GetModelProxyAliasGroupByPayload<T extends ModelProxyAliasGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxyAliasGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxyAliasGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxyAliasGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxyAliasGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxyAliasSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    alias?: boolean
    targetModel?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyAlias"]>

  export type ModelProxyAliasSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    alias?: boolean
    targetModel?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyAlias"]>

  export type ModelProxyAliasSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    alias?: boolean
    targetModel?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["modelProxyAlias"]>

  export type ModelProxyAliasSelectScalar = {
    id?: boolean
    alias?: boolean
    targetModel?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ModelProxyAliasOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "alias" | "targetModel" | "createdAt" | "updatedAt", ExtArgs["result"]["modelProxyAlias"]>

  export type $ModelProxyAliasPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxyAlias"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      alias: string
      targetModel: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["modelProxyAlias"]>
    composites: {}
  }

  type ModelProxyAliasGetPayload<S extends boolean | null | undefined | ModelProxyAliasDefaultArgs> = $Result.GetResult<Prisma.$ModelProxyAliasPayload, S>

  type ModelProxyAliasCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxyAliasFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxyAliasCountAggregateInputType | true
    }

  export interface ModelProxyAliasDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxyAlias'], meta: { name: 'ModelProxyAlias' } }
    /**
     * Find zero or one ModelProxyAlias that matches the filter.
     * @param {ModelProxyAliasFindUniqueArgs} args - Arguments to find a ModelProxyAlias
     * @example
     * // Get one ModelProxyAlias
     * const modelProxyAlias = await prisma.modelProxyAlias.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxyAliasFindUniqueArgs>(args: SelectSubset<T, ModelProxyAliasFindUniqueArgs<ExtArgs>>): Prisma__ModelProxyAliasClient<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxyAlias that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxyAliasFindUniqueOrThrowArgs} args - Arguments to find a ModelProxyAlias
     * @example
     * // Get one ModelProxyAlias
     * const modelProxyAlias = await prisma.modelProxyAlias.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxyAliasFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxyAliasFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxyAliasClient<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyAlias that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyAliasFindFirstArgs} args - Arguments to find a ModelProxyAlias
     * @example
     * // Get one ModelProxyAlias
     * const modelProxyAlias = await prisma.modelProxyAlias.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxyAliasFindFirstArgs>(args?: SelectSubset<T, ModelProxyAliasFindFirstArgs<ExtArgs>>): Prisma__ModelProxyAliasClient<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyAlias that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyAliasFindFirstOrThrowArgs} args - Arguments to find a ModelProxyAlias
     * @example
     * // Get one ModelProxyAlias
     * const modelProxyAlias = await prisma.modelProxyAlias.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxyAliasFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxyAliasFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxyAliasClient<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxyAliases that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyAliasFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxyAliases
     * const modelProxyAliases = await prisma.modelProxyAlias.findMany()
     * 
     * // Get first 10 ModelProxyAliases
     * const modelProxyAliases = await prisma.modelProxyAlias.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxyAliasWithIdOnly = await prisma.modelProxyAlias.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxyAliasFindManyArgs>(args?: SelectSubset<T, ModelProxyAliasFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxyAlias.
     * @param {ModelProxyAliasCreateArgs} args - Arguments to create a ModelProxyAlias.
     * @example
     * // Create one ModelProxyAlias
     * const ModelProxyAlias = await prisma.modelProxyAlias.create({
     *   data: {
     *     // ... data to create a ModelProxyAlias
     *   }
     * })
     * 
     */
    create<T extends ModelProxyAliasCreateArgs>(args: SelectSubset<T, ModelProxyAliasCreateArgs<ExtArgs>>): Prisma__ModelProxyAliasClient<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxyAliases.
     * @param {ModelProxyAliasCreateManyArgs} args - Arguments to create many ModelProxyAliases.
     * @example
     * // Create many ModelProxyAliases
     * const modelProxyAlias = await prisma.modelProxyAlias.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxyAliasCreateManyArgs>(args?: SelectSubset<T, ModelProxyAliasCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxyAliases and returns the data saved in the database.
     * @param {ModelProxyAliasCreateManyAndReturnArgs} args - Arguments to create many ModelProxyAliases.
     * @example
     * // Create many ModelProxyAliases
     * const modelProxyAlias = await prisma.modelProxyAlias.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxyAliases and only return the `id`
     * const modelProxyAliasWithIdOnly = await prisma.modelProxyAlias.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxyAliasCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxyAliasCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxyAlias.
     * @param {ModelProxyAliasDeleteArgs} args - Arguments to delete one ModelProxyAlias.
     * @example
     * // Delete one ModelProxyAlias
     * const ModelProxyAlias = await prisma.modelProxyAlias.delete({
     *   where: {
     *     // ... filter to delete one ModelProxyAlias
     *   }
     * })
     * 
     */
    delete<T extends ModelProxyAliasDeleteArgs>(args: SelectSubset<T, ModelProxyAliasDeleteArgs<ExtArgs>>): Prisma__ModelProxyAliasClient<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxyAlias.
     * @param {ModelProxyAliasUpdateArgs} args - Arguments to update one ModelProxyAlias.
     * @example
     * // Update one ModelProxyAlias
     * const modelProxyAlias = await prisma.modelProxyAlias.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxyAliasUpdateArgs>(args: SelectSubset<T, ModelProxyAliasUpdateArgs<ExtArgs>>): Prisma__ModelProxyAliasClient<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxyAliases.
     * @param {ModelProxyAliasDeleteManyArgs} args - Arguments to filter ModelProxyAliases to delete.
     * @example
     * // Delete a few ModelProxyAliases
     * const { count } = await prisma.modelProxyAlias.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxyAliasDeleteManyArgs>(args?: SelectSubset<T, ModelProxyAliasDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyAliases.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyAliasUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxyAliases
     * const modelProxyAlias = await prisma.modelProxyAlias.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxyAliasUpdateManyArgs>(args: SelectSubset<T, ModelProxyAliasUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyAliases and returns the data updated in the database.
     * @param {ModelProxyAliasUpdateManyAndReturnArgs} args - Arguments to update many ModelProxyAliases.
     * @example
     * // Update many ModelProxyAliases
     * const modelProxyAlias = await prisma.modelProxyAlias.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxyAliases and only return the `id`
     * const modelProxyAliasWithIdOnly = await prisma.modelProxyAlias.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxyAliasUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxyAliasUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxyAlias.
     * @param {ModelProxyAliasUpsertArgs} args - Arguments to update or create a ModelProxyAlias.
     * @example
     * // Update or create a ModelProxyAlias
     * const modelProxyAlias = await prisma.modelProxyAlias.upsert({
     *   create: {
     *     // ... data to create a ModelProxyAlias
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxyAlias we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxyAliasUpsertArgs>(args: SelectSubset<T, ModelProxyAliasUpsertArgs<ExtArgs>>): Prisma__ModelProxyAliasClient<$Result.GetResult<Prisma.$ModelProxyAliasPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxyAliases.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyAliasCountArgs} args - Arguments to filter ModelProxyAliases to count.
     * @example
     * // Count the number of ModelProxyAliases
     * const count = await prisma.modelProxyAlias.count({
     *   where: {
     *     // ... the filter for the ModelProxyAliases we want to count
     *   }
     * })
    **/
    count<T extends ModelProxyAliasCountArgs>(
      args?: Subset<T, ModelProxyAliasCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxyAliasCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxyAlias.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyAliasAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxyAliasAggregateArgs>(args: Subset<T, ModelProxyAliasAggregateArgs>): Prisma.PrismaPromise<GetModelProxyAliasAggregateType<T>>

    /**
     * Group by ModelProxyAlias.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyAliasGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxyAliasGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxyAliasGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxyAliasGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxyAliasGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxyAliasGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxyAlias model
   */
  readonly fields: ModelProxyAliasFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxyAlias.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxyAliasClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxyAlias model
   */
  interface ModelProxyAliasFieldRefs {
    readonly id: FieldRef<"ModelProxyAlias", 'String'>
    readonly alias: FieldRef<"ModelProxyAlias", 'String'>
    readonly targetModel: FieldRef<"ModelProxyAlias", 'String'>
    readonly createdAt: FieldRef<"ModelProxyAlias", 'DateTime'>
    readonly updatedAt: FieldRef<"ModelProxyAlias", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxyAlias findUnique
   */
  export type ModelProxyAliasFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyAlias to fetch.
     */
    where: ModelProxyAliasWhereUniqueInput
  }

  /**
   * ModelProxyAlias findUniqueOrThrow
   */
  export type ModelProxyAliasFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyAlias to fetch.
     */
    where: ModelProxyAliasWhereUniqueInput
  }

  /**
   * ModelProxyAlias findFirst
   */
  export type ModelProxyAliasFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyAlias to fetch.
     */
    where?: ModelProxyAliasWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyAliases to fetch.
     */
    orderBy?: ModelProxyAliasOrderByWithRelationInput | ModelProxyAliasOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyAliases.
     */
    cursor?: ModelProxyAliasWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyAliases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyAliases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyAliases.
     */
    distinct?: ModelProxyAliasScalarFieldEnum | ModelProxyAliasScalarFieldEnum[]
  }

  /**
   * ModelProxyAlias findFirstOrThrow
   */
  export type ModelProxyAliasFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyAlias to fetch.
     */
    where?: ModelProxyAliasWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyAliases to fetch.
     */
    orderBy?: ModelProxyAliasOrderByWithRelationInput | ModelProxyAliasOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyAliases.
     */
    cursor?: ModelProxyAliasWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyAliases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyAliases.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyAliases.
     */
    distinct?: ModelProxyAliasScalarFieldEnum | ModelProxyAliasScalarFieldEnum[]
  }

  /**
   * ModelProxyAlias findMany
   */
  export type ModelProxyAliasFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyAliases to fetch.
     */
    where?: ModelProxyAliasWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyAliases to fetch.
     */
    orderBy?: ModelProxyAliasOrderByWithRelationInput | ModelProxyAliasOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxyAliases.
     */
    cursor?: ModelProxyAliasWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyAliases from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyAliases.
     */
    skip?: number
    distinct?: ModelProxyAliasScalarFieldEnum | ModelProxyAliasScalarFieldEnum[]
  }

  /**
   * ModelProxyAlias create
   */
  export type ModelProxyAliasCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * The data needed to create a ModelProxyAlias.
     */
    data: XOR<ModelProxyAliasCreateInput, ModelProxyAliasUncheckedCreateInput>
  }

  /**
   * ModelProxyAlias createMany
   */
  export type ModelProxyAliasCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxyAliases.
     */
    data: ModelProxyAliasCreateManyInput | ModelProxyAliasCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyAlias createManyAndReturn
   */
  export type ModelProxyAliasCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxyAliases.
     */
    data: ModelProxyAliasCreateManyInput | ModelProxyAliasCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyAlias update
   */
  export type ModelProxyAliasUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * The data needed to update a ModelProxyAlias.
     */
    data: XOR<ModelProxyAliasUpdateInput, ModelProxyAliasUncheckedUpdateInput>
    /**
     * Choose, which ModelProxyAlias to update.
     */
    where: ModelProxyAliasWhereUniqueInput
  }

  /**
   * ModelProxyAlias updateMany
   */
  export type ModelProxyAliasUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxyAliases.
     */
    data: XOR<ModelProxyAliasUpdateManyMutationInput, ModelProxyAliasUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyAliases to update
     */
    where?: ModelProxyAliasWhereInput
    /**
     * Limit how many ModelProxyAliases to update.
     */
    limit?: number
  }

  /**
   * ModelProxyAlias updateManyAndReturn
   */
  export type ModelProxyAliasUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxyAliases.
     */
    data: XOR<ModelProxyAliasUpdateManyMutationInput, ModelProxyAliasUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyAliases to update
     */
    where?: ModelProxyAliasWhereInput
    /**
     * Limit how many ModelProxyAliases to update.
     */
    limit?: number
  }

  /**
   * ModelProxyAlias upsert
   */
  export type ModelProxyAliasUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * The filter to search for the ModelProxyAlias to update in case it exists.
     */
    where: ModelProxyAliasWhereUniqueInput
    /**
     * In case the ModelProxyAlias found by the `where` argument doesn't exist, create a new ModelProxyAlias with this data.
     */
    create: XOR<ModelProxyAliasCreateInput, ModelProxyAliasUncheckedCreateInput>
    /**
     * In case the ModelProxyAlias was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxyAliasUpdateInput, ModelProxyAliasUncheckedUpdateInput>
  }

  /**
   * ModelProxyAlias delete
   */
  export type ModelProxyAliasDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
    /**
     * Filter which ModelProxyAlias to delete.
     */
    where: ModelProxyAliasWhereUniqueInput
  }

  /**
   * ModelProxyAlias deleteMany
   */
  export type ModelProxyAliasDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyAliases to delete
     */
    where?: ModelProxyAliasWhereInput
    /**
     * Limit how many ModelProxyAliases to delete.
     */
    limit?: number
  }

  /**
   * ModelProxyAlias without action
   */
  export type ModelProxyAliasDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyAlias
     */
    select?: ModelProxyAliasSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyAlias
     */
    omit?: ModelProxyAliasOmit<ExtArgs> | null
  }


  /**
   * Model ModelProxyImportJob
   */

  export type AggregateModelProxyImportJob = {
    _count: ModelProxyImportJobCountAggregateOutputType | null
    _min: ModelProxyImportJobMinAggregateOutputType | null
    _max: ModelProxyImportJobMaxAggregateOutputType | null
  }

  export type ModelProxyImportJobMinAggregateOutputType = {
    id: string | null
    source: string | null
    status: string | null
    startedAt: Date | null
    finishedAt: Date | null
    error: string | null
  }

  export type ModelProxyImportJobMaxAggregateOutputType = {
    id: string | null
    source: string | null
    status: string | null
    startedAt: Date | null
    finishedAt: Date | null
    error: string | null
  }

  export type ModelProxyImportJobCountAggregateOutputType = {
    id: number
    source: number
    status: number
    startedAt: number
    finishedAt: number
    summary: number
    error: number
    _all: number
  }


  export type ModelProxyImportJobMinAggregateInputType = {
    id?: true
    source?: true
    status?: true
    startedAt?: true
    finishedAt?: true
    error?: true
  }

  export type ModelProxyImportJobMaxAggregateInputType = {
    id?: true
    source?: true
    status?: true
    startedAt?: true
    finishedAt?: true
    error?: true
  }

  export type ModelProxyImportJobCountAggregateInputType = {
    id?: true
    source?: true
    status?: true
    startedAt?: true
    finishedAt?: true
    summary?: true
    error?: true
    _all?: true
  }

  export type ModelProxyImportJobAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyImportJob to aggregate.
     */
    where?: ModelProxyImportJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyImportJobs to fetch.
     */
    orderBy?: ModelProxyImportJobOrderByWithRelationInput | ModelProxyImportJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelProxyImportJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyImportJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyImportJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ModelProxyImportJobs
    **/
    _count?: true | ModelProxyImportJobCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelProxyImportJobMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelProxyImportJobMaxAggregateInputType
  }

  export type GetModelProxyImportJobAggregateType<T extends ModelProxyImportJobAggregateArgs> = {
        [P in keyof T & keyof AggregateModelProxyImportJob]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModelProxyImportJob[P]>
      : GetScalarType<T[P], AggregateModelProxyImportJob[P]>
  }




  export type ModelProxyImportJobGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelProxyImportJobWhereInput
    orderBy?: ModelProxyImportJobOrderByWithAggregationInput | ModelProxyImportJobOrderByWithAggregationInput[]
    by: ModelProxyImportJobScalarFieldEnum[] | ModelProxyImportJobScalarFieldEnum
    having?: ModelProxyImportJobScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelProxyImportJobCountAggregateInputType | true
    _min?: ModelProxyImportJobMinAggregateInputType
    _max?: ModelProxyImportJobMaxAggregateInputType
  }

  export type ModelProxyImportJobGroupByOutputType = {
    id: string
    source: string
    status: string
    startedAt: Date
    finishedAt: Date | null
    summary: JsonValue | null
    error: string | null
    _count: ModelProxyImportJobCountAggregateOutputType | null
    _min: ModelProxyImportJobMinAggregateOutputType | null
    _max: ModelProxyImportJobMaxAggregateOutputType | null
  }

  type GetModelProxyImportJobGroupByPayload<T extends ModelProxyImportJobGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelProxyImportJobGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelProxyImportJobGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelProxyImportJobGroupByOutputType[P]>
            : GetScalarType<T[P], ModelProxyImportJobGroupByOutputType[P]>
        }
      >
    >


  export type ModelProxyImportJobSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    status?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    summary?: boolean
    error?: boolean
  }, ExtArgs["result"]["modelProxyImportJob"]>

  export type ModelProxyImportJobSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    status?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    summary?: boolean
    error?: boolean
  }, ExtArgs["result"]["modelProxyImportJob"]>

  export type ModelProxyImportJobSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    status?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    summary?: boolean
    error?: boolean
  }, ExtArgs["result"]["modelProxyImportJob"]>

  export type ModelProxyImportJobSelectScalar = {
    id?: boolean
    source?: boolean
    status?: boolean
    startedAt?: boolean
    finishedAt?: boolean
    summary?: boolean
    error?: boolean
  }

  export type ModelProxyImportJobOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "source" | "status" | "startedAt" | "finishedAt" | "summary" | "error", ExtArgs["result"]["modelProxyImportJob"]>

  export type $ModelProxyImportJobPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ModelProxyImportJob"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      source: string
      status: string
      startedAt: Date
      finishedAt: Date | null
      summary: Prisma.JsonValue | null
      error: string | null
    }, ExtArgs["result"]["modelProxyImportJob"]>
    composites: {}
  }

  type ModelProxyImportJobGetPayload<S extends boolean | null | undefined | ModelProxyImportJobDefaultArgs> = $Result.GetResult<Prisma.$ModelProxyImportJobPayload, S>

  type ModelProxyImportJobCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ModelProxyImportJobFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ModelProxyImportJobCountAggregateInputType | true
    }

  export interface ModelProxyImportJobDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ModelProxyImportJob'], meta: { name: 'ModelProxyImportJob' } }
    /**
     * Find zero or one ModelProxyImportJob that matches the filter.
     * @param {ModelProxyImportJobFindUniqueArgs} args - Arguments to find a ModelProxyImportJob
     * @example
     * // Get one ModelProxyImportJob
     * const modelProxyImportJob = await prisma.modelProxyImportJob.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelProxyImportJobFindUniqueArgs>(args: SelectSubset<T, ModelProxyImportJobFindUniqueArgs<ExtArgs>>): Prisma__ModelProxyImportJobClient<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ModelProxyImportJob that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ModelProxyImportJobFindUniqueOrThrowArgs} args - Arguments to find a ModelProxyImportJob
     * @example
     * // Get one ModelProxyImportJob
     * const modelProxyImportJob = await prisma.modelProxyImportJob.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelProxyImportJobFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelProxyImportJobFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelProxyImportJobClient<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyImportJob that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyImportJobFindFirstArgs} args - Arguments to find a ModelProxyImportJob
     * @example
     * // Get one ModelProxyImportJob
     * const modelProxyImportJob = await prisma.modelProxyImportJob.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelProxyImportJobFindFirstArgs>(args?: SelectSubset<T, ModelProxyImportJobFindFirstArgs<ExtArgs>>): Prisma__ModelProxyImportJobClient<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ModelProxyImportJob that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyImportJobFindFirstOrThrowArgs} args - Arguments to find a ModelProxyImportJob
     * @example
     * // Get one ModelProxyImportJob
     * const modelProxyImportJob = await prisma.modelProxyImportJob.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelProxyImportJobFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelProxyImportJobFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelProxyImportJobClient<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ModelProxyImportJobs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyImportJobFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ModelProxyImportJobs
     * const modelProxyImportJobs = await prisma.modelProxyImportJob.findMany()
     * 
     * // Get first 10 ModelProxyImportJobs
     * const modelProxyImportJobs = await prisma.modelProxyImportJob.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelProxyImportJobWithIdOnly = await prisma.modelProxyImportJob.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelProxyImportJobFindManyArgs>(args?: SelectSubset<T, ModelProxyImportJobFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ModelProxyImportJob.
     * @param {ModelProxyImportJobCreateArgs} args - Arguments to create a ModelProxyImportJob.
     * @example
     * // Create one ModelProxyImportJob
     * const ModelProxyImportJob = await prisma.modelProxyImportJob.create({
     *   data: {
     *     // ... data to create a ModelProxyImportJob
     *   }
     * })
     * 
     */
    create<T extends ModelProxyImportJobCreateArgs>(args: SelectSubset<T, ModelProxyImportJobCreateArgs<ExtArgs>>): Prisma__ModelProxyImportJobClient<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ModelProxyImportJobs.
     * @param {ModelProxyImportJobCreateManyArgs} args - Arguments to create many ModelProxyImportJobs.
     * @example
     * // Create many ModelProxyImportJobs
     * const modelProxyImportJob = await prisma.modelProxyImportJob.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelProxyImportJobCreateManyArgs>(args?: SelectSubset<T, ModelProxyImportJobCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ModelProxyImportJobs and returns the data saved in the database.
     * @param {ModelProxyImportJobCreateManyAndReturnArgs} args - Arguments to create many ModelProxyImportJobs.
     * @example
     * // Create many ModelProxyImportJobs
     * const modelProxyImportJob = await prisma.modelProxyImportJob.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ModelProxyImportJobs and only return the `id`
     * const modelProxyImportJobWithIdOnly = await prisma.modelProxyImportJob.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ModelProxyImportJobCreateManyAndReturnArgs>(args?: SelectSubset<T, ModelProxyImportJobCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ModelProxyImportJob.
     * @param {ModelProxyImportJobDeleteArgs} args - Arguments to delete one ModelProxyImportJob.
     * @example
     * // Delete one ModelProxyImportJob
     * const ModelProxyImportJob = await prisma.modelProxyImportJob.delete({
     *   where: {
     *     // ... filter to delete one ModelProxyImportJob
     *   }
     * })
     * 
     */
    delete<T extends ModelProxyImportJobDeleteArgs>(args: SelectSubset<T, ModelProxyImportJobDeleteArgs<ExtArgs>>): Prisma__ModelProxyImportJobClient<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ModelProxyImportJob.
     * @param {ModelProxyImportJobUpdateArgs} args - Arguments to update one ModelProxyImportJob.
     * @example
     * // Update one ModelProxyImportJob
     * const modelProxyImportJob = await prisma.modelProxyImportJob.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelProxyImportJobUpdateArgs>(args: SelectSubset<T, ModelProxyImportJobUpdateArgs<ExtArgs>>): Prisma__ModelProxyImportJobClient<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ModelProxyImportJobs.
     * @param {ModelProxyImportJobDeleteManyArgs} args - Arguments to filter ModelProxyImportJobs to delete.
     * @example
     * // Delete a few ModelProxyImportJobs
     * const { count } = await prisma.modelProxyImportJob.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelProxyImportJobDeleteManyArgs>(args?: SelectSubset<T, ModelProxyImportJobDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyImportJobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyImportJobUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ModelProxyImportJobs
     * const modelProxyImportJob = await prisma.modelProxyImportJob.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelProxyImportJobUpdateManyArgs>(args: SelectSubset<T, ModelProxyImportJobUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ModelProxyImportJobs and returns the data updated in the database.
     * @param {ModelProxyImportJobUpdateManyAndReturnArgs} args - Arguments to update many ModelProxyImportJobs.
     * @example
     * // Update many ModelProxyImportJobs
     * const modelProxyImportJob = await prisma.modelProxyImportJob.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ModelProxyImportJobs and only return the `id`
     * const modelProxyImportJobWithIdOnly = await prisma.modelProxyImportJob.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ModelProxyImportJobUpdateManyAndReturnArgs>(args: SelectSubset<T, ModelProxyImportJobUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ModelProxyImportJob.
     * @param {ModelProxyImportJobUpsertArgs} args - Arguments to update or create a ModelProxyImportJob.
     * @example
     * // Update or create a ModelProxyImportJob
     * const modelProxyImportJob = await prisma.modelProxyImportJob.upsert({
     *   create: {
     *     // ... data to create a ModelProxyImportJob
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ModelProxyImportJob we want to update
     *   }
     * })
     */
    upsert<T extends ModelProxyImportJobUpsertArgs>(args: SelectSubset<T, ModelProxyImportJobUpsertArgs<ExtArgs>>): Prisma__ModelProxyImportJobClient<$Result.GetResult<Prisma.$ModelProxyImportJobPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ModelProxyImportJobs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyImportJobCountArgs} args - Arguments to filter ModelProxyImportJobs to count.
     * @example
     * // Count the number of ModelProxyImportJobs
     * const count = await prisma.modelProxyImportJob.count({
     *   where: {
     *     // ... the filter for the ModelProxyImportJobs we want to count
     *   }
     * })
    **/
    count<T extends ModelProxyImportJobCountArgs>(
      args?: Subset<T, ModelProxyImportJobCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelProxyImportJobCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ModelProxyImportJob.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyImportJobAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelProxyImportJobAggregateArgs>(args: Subset<T, ModelProxyImportJobAggregateArgs>): Prisma.PrismaPromise<GetModelProxyImportJobAggregateType<T>>

    /**
     * Group by ModelProxyImportJob.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelProxyImportJobGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelProxyImportJobGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelProxyImportJobGroupByArgs['orderBy'] }
        : { orderBy?: ModelProxyImportJobGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelProxyImportJobGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelProxyImportJobGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ModelProxyImportJob model
   */
  readonly fields: ModelProxyImportJobFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ModelProxyImportJob.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelProxyImportJobClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ModelProxyImportJob model
   */
  interface ModelProxyImportJobFieldRefs {
    readonly id: FieldRef<"ModelProxyImportJob", 'String'>
    readonly source: FieldRef<"ModelProxyImportJob", 'String'>
    readonly status: FieldRef<"ModelProxyImportJob", 'String'>
    readonly startedAt: FieldRef<"ModelProxyImportJob", 'DateTime'>
    readonly finishedAt: FieldRef<"ModelProxyImportJob", 'DateTime'>
    readonly summary: FieldRef<"ModelProxyImportJob", 'Json'>
    readonly error: FieldRef<"ModelProxyImportJob", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ModelProxyImportJob findUnique
   */
  export type ModelProxyImportJobFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyImportJob to fetch.
     */
    where: ModelProxyImportJobWhereUniqueInput
  }

  /**
   * ModelProxyImportJob findUniqueOrThrow
   */
  export type ModelProxyImportJobFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyImportJob to fetch.
     */
    where: ModelProxyImportJobWhereUniqueInput
  }

  /**
   * ModelProxyImportJob findFirst
   */
  export type ModelProxyImportJobFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyImportJob to fetch.
     */
    where?: ModelProxyImportJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyImportJobs to fetch.
     */
    orderBy?: ModelProxyImportJobOrderByWithRelationInput | ModelProxyImportJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyImportJobs.
     */
    cursor?: ModelProxyImportJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyImportJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyImportJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyImportJobs.
     */
    distinct?: ModelProxyImportJobScalarFieldEnum | ModelProxyImportJobScalarFieldEnum[]
  }

  /**
   * ModelProxyImportJob findFirstOrThrow
   */
  export type ModelProxyImportJobFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyImportJob to fetch.
     */
    where?: ModelProxyImportJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyImportJobs to fetch.
     */
    orderBy?: ModelProxyImportJobOrderByWithRelationInput | ModelProxyImportJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ModelProxyImportJobs.
     */
    cursor?: ModelProxyImportJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyImportJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyImportJobs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ModelProxyImportJobs.
     */
    distinct?: ModelProxyImportJobScalarFieldEnum | ModelProxyImportJobScalarFieldEnum[]
  }

  /**
   * ModelProxyImportJob findMany
   */
  export type ModelProxyImportJobFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * Filter, which ModelProxyImportJobs to fetch.
     */
    where?: ModelProxyImportJobWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ModelProxyImportJobs to fetch.
     */
    orderBy?: ModelProxyImportJobOrderByWithRelationInput | ModelProxyImportJobOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ModelProxyImportJobs.
     */
    cursor?: ModelProxyImportJobWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ModelProxyImportJobs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ModelProxyImportJobs.
     */
    skip?: number
    distinct?: ModelProxyImportJobScalarFieldEnum | ModelProxyImportJobScalarFieldEnum[]
  }

  /**
   * ModelProxyImportJob create
   */
  export type ModelProxyImportJobCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * The data needed to create a ModelProxyImportJob.
     */
    data: XOR<ModelProxyImportJobCreateInput, ModelProxyImportJobUncheckedCreateInput>
  }

  /**
   * ModelProxyImportJob createMany
   */
  export type ModelProxyImportJobCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ModelProxyImportJobs.
     */
    data: ModelProxyImportJobCreateManyInput | ModelProxyImportJobCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyImportJob createManyAndReturn
   */
  export type ModelProxyImportJobCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * The data used to create many ModelProxyImportJobs.
     */
    data: ModelProxyImportJobCreateManyInput | ModelProxyImportJobCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ModelProxyImportJob update
   */
  export type ModelProxyImportJobUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * The data needed to update a ModelProxyImportJob.
     */
    data: XOR<ModelProxyImportJobUpdateInput, ModelProxyImportJobUncheckedUpdateInput>
    /**
     * Choose, which ModelProxyImportJob to update.
     */
    where: ModelProxyImportJobWhereUniqueInput
  }

  /**
   * ModelProxyImportJob updateMany
   */
  export type ModelProxyImportJobUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ModelProxyImportJobs.
     */
    data: XOR<ModelProxyImportJobUpdateManyMutationInput, ModelProxyImportJobUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyImportJobs to update
     */
    where?: ModelProxyImportJobWhereInput
    /**
     * Limit how many ModelProxyImportJobs to update.
     */
    limit?: number
  }

  /**
   * ModelProxyImportJob updateManyAndReturn
   */
  export type ModelProxyImportJobUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * The data used to update ModelProxyImportJobs.
     */
    data: XOR<ModelProxyImportJobUpdateManyMutationInput, ModelProxyImportJobUncheckedUpdateManyInput>
    /**
     * Filter which ModelProxyImportJobs to update
     */
    where?: ModelProxyImportJobWhereInput
    /**
     * Limit how many ModelProxyImportJobs to update.
     */
    limit?: number
  }

  /**
   * ModelProxyImportJob upsert
   */
  export type ModelProxyImportJobUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * The filter to search for the ModelProxyImportJob to update in case it exists.
     */
    where: ModelProxyImportJobWhereUniqueInput
    /**
     * In case the ModelProxyImportJob found by the `where` argument doesn't exist, create a new ModelProxyImportJob with this data.
     */
    create: XOR<ModelProxyImportJobCreateInput, ModelProxyImportJobUncheckedCreateInput>
    /**
     * In case the ModelProxyImportJob was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelProxyImportJobUpdateInput, ModelProxyImportJobUncheckedUpdateInput>
  }

  /**
   * ModelProxyImportJob delete
   */
  export type ModelProxyImportJobDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
    /**
     * Filter which ModelProxyImportJob to delete.
     */
    where: ModelProxyImportJobWhereUniqueInput
  }

  /**
   * ModelProxyImportJob deleteMany
   */
  export type ModelProxyImportJobDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ModelProxyImportJobs to delete
     */
    where?: ModelProxyImportJobWhereInput
    /**
     * Limit how many ModelProxyImportJobs to delete.
     */
    limit?: number
  }

  /**
   * ModelProxyImportJob without action
   */
  export type ModelProxyImportJobDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelProxyImportJob
     */
    select?: ModelProxyImportJobSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ModelProxyImportJob
     */
    omit?: ModelProxyImportJobOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ModelProxyRequestScalarFieldEnum: {
    id: 'id',
    upstreamRequestId: 'upstreamRequestId',
    model: 'model',
    upstreamModel: 'upstreamModel',
    upstreamBaseUrl: 'upstreamBaseUrl',
    status: 'status',
    startedAt: 'startedAt',
    finishedAt: 'finishedAt',
    latencyMs: 'latencyMs',
    ttftMs: 'ttftMs',
    inputTokens: 'inputTokens',
    outputTokens: 'outputTokens',
    totalTokens: 'totalTokens',
    cachedTokens: 'cachedTokens',
    reasoningTokens: 'reasoningTokens',
    usageEstimated: 'usageEstimated',
    inputCostPerToken: 'inputCostPerToken',
    outputCostPerToken: 'outputCostPerToken',
    inputCost: 'inputCost',
    outputCost: 'outputCost',
    totalCost: 'totalCost',
    costEstimated: 'costEstimated',
    estimatedCostUsd: 'estimatedCostUsd',
    errorSummary: 'errorSummary',
    errorType: 'errorType',
    errorMessage: 'errorMessage',
    errorStatusCode: 'errorStatusCode',
    errorDetails: 'errorDetails',
    requestBody: 'requestBody',
    responseBody: 'responseBody',
    responseHeaders: 'responseHeaders',
    apiKeyAlias: 'apiKeyAlias',
    endUser: 'endUser'
  };

  export type ModelProxyRequestScalarFieldEnum = (typeof ModelProxyRequestScalarFieldEnum)[keyof typeof ModelProxyRequestScalarFieldEnum]


  export const ModelProxyUsageAdjustmentScalarFieldEnum: {
    id: 'id',
    requestId: 'requestId',
    reason: 'reason',
    promptTokensDelta: 'promptTokensDelta',
    completionTokensDelta: 'completionTokensDelta',
    totalCostDelta: 'totalCostDelta',
    note: 'note',
    createdAt: 'createdAt'
  };

  export type ModelProxyUsageAdjustmentScalarFieldEnum = (typeof ModelProxyUsageAdjustmentScalarFieldEnum)[keyof typeof ModelProxyUsageAdjustmentScalarFieldEnum]


  export const ModelProxyMessageScalarFieldEnum: {
    id: 'id',
    requestId: 'requestId',
    role: 'role',
    content: 'content',
    createdAt: 'createdAt'
  };

  export type ModelProxyMessageScalarFieldEnum = (typeof ModelProxyMessageScalarFieldEnum)[keyof typeof ModelProxyMessageScalarFieldEnum]


  export const ModelProxyModelScalarFieldEnum: {
    id: 'id',
    modelName: 'modelName',
    enabled: 'enabled',
    displayName: 'displayName',
    family: 'family',
    ownedBy: 'ownedBy',
    apiMode: 'apiMode',
    vision: 'vision',
    contextWindowSize: 'contextWindowSize',
    maxOutputTokens: 'maxOutputTokens',
    inputCostPerToken: 'inputCostPerToken',
    outputCostPerToken: 'outputCostPerToken',
    upstreamModel: 'upstreamModel',
    upstreamBaseUrl: 'upstreamBaseUrl',
    credentialName: 'credentialName',
    secretRef: 'secretRef',
    requestOptions: 'requestOptions',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ModelProxyModelScalarFieldEnum = (typeof ModelProxyModelScalarFieldEnum)[keyof typeof ModelProxyModelScalarFieldEnum]


  export const ModelProxyCredentialScalarFieldEnum: {
    id: 'id',
    name: 'name',
    provider: 'provider',
    baseUrl: 'baseUrl',
    apiKey: 'apiKey',
    secretRef: 'secretRef',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ModelProxyCredentialScalarFieldEnum = (typeof ModelProxyCredentialScalarFieldEnum)[keyof typeof ModelProxyCredentialScalarFieldEnum]


  export const ModelProxyApiKeyScalarFieldEnum: {
    id: 'id',
    label: 'label',
    keyHash: 'keyHash',
    enabled: 'enabled',
    lastUsedAt: 'lastUsedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ModelProxyApiKeyScalarFieldEnum = (typeof ModelProxyApiKeyScalarFieldEnum)[keyof typeof ModelProxyApiKeyScalarFieldEnum]


  export const ModelProxySettingScalarFieldEnum: {
    id: 'id',
    key: 'key',
    value: 'value',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ModelProxySettingScalarFieldEnum = (typeof ModelProxySettingScalarFieldEnum)[keyof typeof ModelProxySettingScalarFieldEnum]


  export const ModelProxyAliasScalarFieldEnum: {
    id: 'id',
    alias: 'alias',
    targetModel: 'targetModel',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ModelProxyAliasScalarFieldEnum = (typeof ModelProxyAliasScalarFieldEnum)[keyof typeof ModelProxyAliasScalarFieldEnum]


  export const ModelProxyImportJobScalarFieldEnum: {
    id: 'id',
    source: 'source',
    status: 'status',
    startedAt: 'startedAt',
    finishedAt: 'finishedAt',
    summary: 'summary',
    error: 'error'
  };

  export type ModelProxyImportJobScalarFieldEnum = (typeof ModelProxyImportJobScalarFieldEnum)[keyof typeof ModelProxyImportJobScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    
  /**
   * Deep Input Types
   */


  export type ModelProxyRequestWhereInput = {
    AND?: ModelProxyRequestWhereInput | ModelProxyRequestWhereInput[]
    OR?: ModelProxyRequestWhereInput[]
    NOT?: ModelProxyRequestWhereInput | ModelProxyRequestWhereInput[]
    id?: StringFilter<"ModelProxyRequest"> | string
    upstreamRequestId?: StringNullableFilter<"ModelProxyRequest"> | string | null
    model?: StringFilter<"ModelProxyRequest"> | string
    upstreamModel?: StringFilter<"ModelProxyRequest"> | string
    upstreamBaseUrl?: StringFilter<"ModelProxyRequest"> | string
    status?: StringFilter<"ModelProxyRequest"> | string
    startedAt?: DateTimeFilter<"ModelProxyRequest"> | Date | string
    finishedAt?: DateTimeNullableFilter<"ModelProxyRequest"> | Date | string | null
    latencyMs?: IntNullableFilter<"ModelProxyRequest"> | number | null
    ttftMs?: IntNullableFilter<"ModelProxyRequest"> | number | null
    inputTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    outputTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    totalTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    cachedTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    reasoningTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    usageEstimated?: BoolNullableFilter<"ModelProxyRequest"> | boolean | null
    inputCostPerToken?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    outputCostPerToken?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    inputCost?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    outputCost?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    totalCost?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    costEstimated?: BoolNullableFilter<"ModelProxyRequest"> | boolean | null
    estimatedCostUsd?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    errorSummary?: StringNullableFilter<"ModelProxyRequest"> | string | null
    errorType?: StringNullableFilter<"ModelProxyRequest"> | string | null
    errorMessage?: StringNullableFilter<"ModelProxyRequest"> | string | null
    errorStatusCode?: IntNullableFilter<"ModelProxyRequest"> | number | null
    errorDetails?: JsonNullableFilter<"ModelProxyRequest">
    requestBody?: JsonNullableFilter<"ModelProxyRequest">
    responseBody?: JsonNullableFilter<"ModelProxyRequest">
    responseHeaders?: JsonNullableFilter<"ModelProxyRequest">
    apiKeyAlias?: StringNullableFilter<"ModelProxyRequest"> | string | null
    endUser?: StringNullableFilter<"ModelProxyRequest"> | string | null
    messages?: ModelProxyMessageListRelationFilter
    usageAdjustments?: ModelProxyUsageAdjustmentListRelationFilter
  }

  export type ModelProxyRequestOrderByWithRelationInput = {
    id?: SortOrder
    upstreamRequestId?: SortOrderInput | SortOrder
    model?: SortOrder
    upstreamModel?: SortOrder
    upstreamBaseUrl?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrderInput | SortOrder
    latencyMs?: SortOrderInput | SortOrder
    ttftMs?: SortOrderInput | SortOrder
    inputTokens?: SortOrderInput | SortOrder
    outputTokens?: SortOrderInput | SortOrder
    totalTokens?: SortOrderInput | SortOrder
    cachedTokens?: SortOrderInput | SortOrder
    reasoningTokens?: SortOrderInput | SortOrder
    usageEstimated?: SortOrderInput | SortOrder
    inputCostPerToken?: SortOrderInput | SortOrder
    outputCostPerToken?: SortOrderInput | SortOrder
    inputCost?: SortOrderInput | SortOrder
    outputCost?: SortOrderInput | SortOrder
    totalCost?: SortOrderInput | SortOrder
    costEstimated?: SortOrderInput | SortOrder
    estimatedCostUsd?: SortOrderInput | SortOrder
    errorSummary?: SortOrderInput | SortOrder
    errorType?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    errorStatusCode?: SortOrderInput | SortOrder
    errorDetails?: SortOrderInput | SortOrder
    requestBody?: SortOrderInput | SortOrder
    responseBody?: SortOrderInput | SortOrder
    responseHeaders?: SortOrderInput | SortOrder
    apiKeyAlias?: SortOrderInput | SortOrder
    endUser?: SortOrderInput | SortOrder
    messages?: ModelProxyMessageOrderByRelationAggregateInput
    usageAdjustments?: ModelProxyUsageAdjustmentOrderByRelationAggregateInput
  }

  export type ModelProxyRequestWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ModelProxyRequestWhereInput | ModelProxyRequestWhereInput[]
    OR?: ModelProxyRequestWhereInput[]
    NOT?: ModelProxyRequestWhereInput | ModelProxyRequestWhereInput[]
    upstreamRequestId?: StringNullableFilter<"ModelProxyRequest"> | string | null
    model?: StringFilter<"ModelProxyRequest"> | string
    upstreamModel?: StringFilter<"ModelProxyRequest"> | string
    upstreamBaseUrl?: StringFilter<"ModelProxyRequest"> | string
    status?: StringFilter<"ModelProxyRequest"> | string
    startedAt?: DateTimeFilter<"ModelProxyRequest"> | Date | string
    finishedAt?: DateTimeNullableFilter<"ModelProxyRequest"> | Date | string | null
    latencyMs?: IntNullableFilter<"ModelProxyRequest"> | number | null
    ttftMs?: IntNullableFilter<"ModelProxyRequest"> | number | null
    inputTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    outputTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    totalTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    cachedTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    reasoningTokens?: IntNullableFilter<"ModelProxyRequest"> | number | null
    usageEstimated?: BoolNullableFilter<"ModelProxyRequest"> | boolean | null
    inputCostPerToken?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    outputCostPerToken?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    inputCost?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    outputCost?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    totalCost?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    costEstimated?: BoolNullableFilter<"ModelProxyRequest"> | boolean | null
    estimatedCostUsd?: FloatNullableFilter<"ModelProxyRequest"> | number | null
    errorSummary?: StringNullableFilter<"ModelProxyRequest"> | string | null
    errorType?: StringNullableFilter<"ModelProxyRequest"> | string | null
    errorMessage?: StringNullableFilter<"ModelProxyRequest"> | string | null
    errorStatusCode?: IntNullableFilter<"ModelProxyRequest"> | number | null
    errorDetails?: JsonNullableFilter<"ModelProxyRequest">
    requestBody?: JsonNullableFilter<"ModelProxyRequest">
    responseBody?: JsonNullableFilter<"ModelProxyRequest">
    responseHeaders?: JsonNullableFilter<"ModelProxyRequest">
    apiKeyAlias?: StringNullableFilter<"ModelProxyRequest"> | string | null
    endUser?: StringNullableFilter<"ModelProxyRequest"> | string | null
    messages?: ModelProxyMessageListRelationFilter
    usageAdjustments?: ModelProxyUsageAdjustmentListRelationFilter
  }, "id">

  export type ModelProxyRequestOrderByWithAggregationInput = {
    id?: SortOrder
    upstreamRequestId?: SortOrderInput | SortOrder
    model?: SortOrder
    upstreamModel?: SortOrder
    upstreamBaseUrl?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrderInput | SortOrder
    latencyMs?: SortOrderInput | SortOrder
    ttftMs?: SortOrderInput | SortOrder
    inputTokens?: SortOrderInput | SortOrder
    outputTokens?: SortOrderInput | SortOrder
    totalTokens?: SortOrderInput | SortOrder
    cachedTokens?: SortOrderInput | SortOrder
    reasoningTokens?: SortOrderInput | SortOrder
    usageEstimated?: SortOrderInput | SortOrder
    inputCostPerToken?: SortOrderInput | SortOrder
    outputCostPerToken?: SortOrderInput | SortOrder
    inputCost?: SortOrderInput | SortOrder
    outputCost?: SortOrderInput | SortOrder
    totalCost?: SortOrderInput | SortOrder
    costEstimated?: SortOrderInput | SortOrder
    estimatedCostUsd?: SortOrderInput | SortOrder
    errorSummary?: SortOrderInput | SortOrder
    errorType?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    errorStatusCode?: SortOrderInput | SortOrder
    errorDetails?: SortOrderInput | SortOrder
    requestBody?: SortOrderInput | SortOrder
    responseBody?: SortOrderInput | SortOrder
    responseHeaders?: SortOrderInput | SortOrder
    apiKeyAlias?: SortOrderInput | SortOrder
    endUser?: SortOrderInput | SortOrder
    _count?: ModelProxyRequestCountOrderByAggregateInput
    _avg?: ModelProxyRequestAvgOrderByAggregateInput
    _max?: ModelProxyRequestMaxOrderByAggregateInput
    _min?: ModelProxyRequestMinOrderByAggregateInput
    _sum?: ModelProxyRequestSumOrderByAggregateInput
  }

  export type ModelProxyRequestScalarWhereWithAggregatesInput = {
    AND?: ModelProxyRequestScalarWhereWithAggregatesInput | ModelProxyRequestScalarWhereWithAggregatesInput[]
    OR?: ModelProxyRequestScalarWhereWithAggregatesInput[]
    NOT?: ModelProxyRequestScalarWhereWithAggregatesInput | ModelProxyRequestScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxyRequest"> | string
    upstreamRequestId?: StringNullableWithAggregatesFilter<"ModelProxyRequest"> | string | null
    model?: StringWithAggregatesFilter<"ModelProxyRequest"> | string
    upstreamModel?: StringWithAggregatesFilter<"ModelProxyRequest"> | string
    upstreamBaseUrl?: StringWithAggregatesFilter<"ModelProxyRequest"> | string
    status?: StringWithAggregatesFilter<"ModelProxyRequest"> | string
    startedAt?: DateTimeWithAggregatesFilter<"ModelProxyRequest"> | Date | string
    finishedAt?: DateTimeNullableWithAggregatesFilter<"ModelProxyRequest"> | Date | string | null
    latencyMs?: IntNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    ttftMs?: IntNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    inputTokens?: IntNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    outputTokens?: IntNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    totalTokens?: IntNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    cachedTokens?: IntNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    reasoningTokens?: IntNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    usageEstimated?: BoolNullableWithAggregatesFilter<"ModelProxyRequest"> | boolean | null
    inputCostPerToken?: FloatNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    outputCostPerToken?: FloatNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    inputCost?: FloatNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    outputCost?: FloatNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    totalCost?: FloatNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    costEstimated?: BoolNullableWithAggregatesFilter<"ModelProxyRequest"> | boolean | null
    estimatedCostUsd?: FloatNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    errorSummary?: StringNullableWithAggregatesFilter<"ModelProxyRequest"> | string | null
    errorType?: StringNullableWithAggregatesFilter<"ModelProxyRequest"> | string | null
    errorMessage?: StringNullableWithAggregatesFilter<"ModelProxyRequest"> | string | null
    errorStatusCode?: IntNullableWithAggregatesFilter<"ModelProxyRequest"> | number | null
    errorDetails?: JsonNullableWithAggregatesFilter<"ModelProxyRequest">
    requestBody?: JsonNullableWithAggregatesFilter<"ModelProxyRequest">
    responseBody?: JsonNullableWithAggregatesFilter<"ModelProxyRequest">
    responseHeaders?: JsonNullableWithAggregatesFilter<"ModelProxyRequest">
    apiKeyAlias?: StringNullableWithAggregatesFilter<"ModelProxyRequest"> | string | null
    endUser?: StringNullableWithAggregatesFilter<"ModelProxyRequest"> | string | null
  }

  export type ModelProxyUsageAdjustmentWhereInput = {
    AND?: ModelProxyUsageAdjustmentWhereInput | ModelProxyUsageAdjustmentWhereInput[]
    OR?: ModelProxyUsageAdjustmentWhereInput[]
    NOT?: ModelProxyUsageAdjustmentWhereInput | ModelProxyUsageAdjustmentWhereInput[]
    id?: StringFilter<"ModelProxyUsageAdjustment"> | string
    requestId?: StringFilter<"ModelProxyUsageAdjustment"> | string
    reason?: StringFilter<"ModelProxyUsageAdjustment"> | string
    promptTokensDelta?: IntFilter<"ModelProxyUsageAdjustment"> | number
    completionTokensDelta?: IntFilter<"ModelProxyUsageAdjustment"> | number
    totalCostDelta?: FloatFilter<"ModelProxyUsageAdjustment"> | number
    note?: StringNullableFilter<"ModelProxyUsageAdjustment"> | string | null
    createdAt?: DateTimeFilter<"ModelProxyUsageAdjustment"> | Date | string
    request?: XOR<ModelProxyRequestScalarRelationFilter, ModelProxyRequestWhereInput>
  }

  export type ModelProxyUsageAdjustmentOrderByWithRelationInput = {
    id?: SortOrder
    requestId?: SortOrder
    reason?: SortOrder
    promptTokensDelta?: SortOrder
    completionTokensDelta?: SortOrder
    totalCostDelta?: SortOrder
    note?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    request?: ModelProxyRequestOrderByWithRelationInput
  }

  export type ModelProxyUsageAdjustmentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ModelProxyUsageAdjustmentWhereInput | ModelProxyUsageAdjustmentWhereInput[]
    OR?: ModelProxyUsageAdjustmentWhereInput[]
    NOT?: ModelProxyUsageAdjustmentWhereInput | ModelProxyUsageAdjustmentWhereInput[]
    requestId?: StringFilter<"ModelProxyUsageAdjustment"> | string
    reason?: StringFilter<"ModelProxyUsageAdjustment"> | string
    promptTokensDelta?: IntFilter<"ModelProxyUsageAdjustment"> | number
    completionTokensDelta?: IntFilter<"ModelProxyUsageAdjustment"> | number
    totalCostDelta?: FloatFilter<"ModelProxyUsageAdjustment"> | number
    note?: StringNullableFilter<"ModelProxyUsageAdjustment"> | string | null
    createdAt?: DateTimeFilter<"ModelProxyUsageAdjustment"> | Date | string
    request?: XOR<ModelProxyRequestScalarRelationFilter, ModelProxyRequestWhereInput>
  }, "id">

  export type ModelProxyUsageAdjustmentOrderByWithAggregationInput = {
    id?: SortOrder
    requestId?: SortOrder
    reason?: SortOrder
    promptTokensDelta?: SortOrder
    completionTokensDelta?: SortOrder
    totalCostDelta?: SortOrder
    note?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ModelProxyUsageAdjustmentCountOrderByAggregateInput
    _avg?: ModelProxyUsageAdjustmentAvgOrderByAggregateInput
    _max?: ModelProxyUsageAdjustmentMaxOrderByAggregateInput
    _min?: ModelProxyUsageAdjustmentMinOrderByAggregateInput
    _sum?: ModelProxyUsageAdjustmentSumOrderByAggregateInput
  }

  export type ModelProxyUsageAdjustmentScalarWhereWithAggregatesInput = {
    AND?: ModelProxyUsageAdjustmentScalarWhereWithAggregatesInput | ModelProxyUsageAdjustmentScalarWhereWithAggregatesInput[]
    OR?: ModelProxyUsageAdjustmentScalarWhereWithAggregatesInput[]
    NOT?: ModelProxyUsageAdjustmentScalarWhereWithAggregatesInput | ModelProxyUsageAdjustmentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxyUsageAdjustment"> | string
    requestId?: StringWithAggregatesFilter<"ModelProxyUsageAdjustment"> | string
    reason?: StringWithAggregatesFilter<"ModelProxyUsageAdjustment"> | string
    promptTokensDelta?: IntWithAggregatesFilter<"ModelProxyUsageAdjustment"> | number
    completionTokensDelta?: IntWithAggregatesFilter<"ModelProxyUsageAdjustment"> | number
    totalCostDelta?: FloatWithAggregatesFilter<"ModelProxyUsageAdjustment"> | number
    note?: StringNullableWithAggregatesFilter<"ModelProxyUsageAdjustment"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ModelProxyUsageAdjustment"> | Date | string
  }

  export type ModelProxyMessageWhereInput = {
    AND?: ModelProxyMessageWhereInput | ModelProxyMessageWhereInput[]
    OR?: ModelProxyMessageWhereInput[]
    NOT?: ModelProxyMessageWhereInput | ModelProxyMessageWhereInput[]
    id?: StringFilter<"ModelProxyMessage"> | string
    requestId?: StringFilter<"ModelProxyMessage"> | string
    role?: StringFilter<"ModelProxyMessage"> | string
    content?: JsonFilter<"ModelProxyMessage">
    createdAt?: DateTimeFilter<"ModelProxyMessage"> | Date | string
    request?: XOR<ModelProxyRequestScalarRelationFilter, ModelProxyRequestWhereInput>
  }

  export type ModelProxyMessageOrderByWithRelationInput = {
    id?: SortOrder
    requestId?: SortOrder
    role?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    request?: ModelProxyRequestOrderByWithRelationInput
  }

  export type ModelProxyMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ModelProxyMessageWhereInput | ModelProxyMessageWhereInput[]
    OR?: ModelProxyMessageWhereInput[]
    NOT?: ModelProxyMessageWhereInput | ModelProxyMessageWhereInput[]
    requestId?: StringFilter<"ModelProxyMessage"> | string
    role?: StringFilter<"ModelProxyMessage"> | string
    content?: JsonFilter<"ModelProxyMessage">
    createdAt?: DateTimeFilter<"ModelProxyMessage"> | Date | string
    request?: XOR<ModelProxyRequestScalarRelationFilter, ModelProxyRequestWhereInput>
  }, "id">

  export type ModelProxyMessageOrderByWithAggregationInput = {
    id?: SortOrder
    requestId?: SortOrder
    role?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
    _count?: ModelProxyMessageCountOrderByAggregateInput
    _max?: ModelProxyMessageMaxOrderByAggregateInput
    _min?: ModelProxyMessageMinOrderByAggregateInput
  }

  export type ModelProxyMessageScalarWhereWithAggregatesInput = {
    AND?: ModelProxyMessageScalarWhereWithAggregatesInput | ModelProxyMessageScalarWhereWithAggregatesInput[]
    OR?: ModelProxyMessageScalarWhereWithAggregatesInput[]
    NOT?: ModelProxyMessageScalarWhereWithAggregatesInput | ModelProxyMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxyMessage"> | string
    requestId?: StringWithAggregatesFilter<"ModelProxyMessage"> | string
    role?: StringWithAggregatesFilter<"ModelProxyMessage"> | string
    content?: JsonWithAggregatesFilter<"ModelProxyMessage">
    createdAt?: DateTimeWithAggregatesFilter<"ModelProxyMessage"> | Date | string
  }

  export type ModelProxyModelWhereInput = {
    AND?: ModelProxyModelWhereInput | ModelProxyModelWhereInput[]
    OR?: ModelProxyModelWhereInput[]
    NOT?: ModelProxyModelWhereInput | ModelProxyModelWhereInput[]
    id?: StringFilter<"ModelProxyModel"> | string
    modelName?: StringFilter<"ModelProxyModel"> | string
    enabled?: BoolFilter<"ModelProxyModel"> | boolean
    displayName?: StringNullableFilter<"ModelProxyModel"> | string | null
    family?: StringNullableFilter<"ModelProxyModel"> | string | null
    ownedBy?: StringNullableFilter<"ModelProxyModel"> | string | null
    apiMode?: StringNullableFilter<"ModelProxyModel"> | string | null
    vision?: BoolNullableFilter<"ModelProxyModel"> | boolean | null
    contextWindowSize?: IntNullableFilter<"ModelProxyModel"> | number | null
    maxOutputTokens?: IntNullableFilter<"ModelProxyModel"> | number | null
    inputCostPerToken?: FloatNullableFilter<"ModelProxyModel"> | number | null
    outputCostPerToken?: FloatNullableFilter<"ModelProxyModel"> | number | null
    upstreamModel?: StringNullableFilter<"ModelProxyModel"> | string | null
    upstreamBaseUrl?: StringNullableFilter<"ModelProxyModel"> | string | null
    credentialName?: StringNullableFilter<"ModelProxyModel"> | string | null
    secretRef?: StringNullableFilter<"ModelProxyModel"> | string | null
    requestOptions?: JsonNullableFilter<"ModelProxyModel">
    createdAt?: DateTimeFilter<"ModelProxyModel"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxyModel"> | Date | string
  }

  export type ModelProxyModelOrderByWithRelationInput = {
    id?: SortOrder
    modelName?: SortOrder
    enabled?: SortOrder
    displayName?: SortOrderInput | SortOrder
    family?: SortOrderInput | SortOrder
    ownedBy?: SortOrderInput | SortOrder
    apiMode?: SortOrderInput | SortOrder
    vision?: SortOrderInput | SortOrder
    contextWindowSize?: SortOrderInput | SortOrder
    maxOutputTokens?: SortOrderInput | SortOrder
    inputCostPerToken?: SortOrderInput | SortOrder
    outputCostPerToken?: SortOrderInput | SortOrder
    upstreamModel?: SortOrderInput | SortOrder
    upstreamBaseUrl?: SortOrderInput | SortOrder
    credentialName?: SortOrderInput | SortOrder
    secretRef?: SortOrderInput | SortOrder
    requestOptions?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyModelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    modelName?: string
    AND?: ModelProxyModelWhereInput | ModelProxyModelWhereInput[]
    OR?: ModelProxyModelWhereInput[]
    NOT?: ModelProxyModelWhereInput | ModelProxyModelWhereInput[]
    enabled?: BoolFilter<"ModelProxyModel"> | boolean
    displayName?: StringNullableFilter<"ModelProxyModel"> | string | null
    family?: StringNullableFilter<"ModelProxyModel"> | string | null
    ownedBy?: StringNullableFilter<"ModelProxyModel"> | string | null
    apiMode?: StringNullableFilter<"ModelProxyModel"> | string | null
    vision?: BoolNullableFilter<"ModelProxyModel"> | boolean | null
    contextWindowSize?: IntNullableFilter<"ModelProxyModel"> | number | null
    maxOutputTokens?: IntNullableFilter<"ModelProxyModel"> | number | null
    inputCostPerToken?: FloatNullableFilter<"ModelProxyModel"> | number | null
    outputCostPerToken?: FloatNullableFilter<"ModelProxyModel"> | number | null
    upstreamModel?: StringNullableFilter<"ModelProxyModel"> | string | null
    upstreamBaseUrl?: StringNullableFilter<"ModelProxyModel"> | string | null
    credentialName?: StringNullableFilter<"ModelProxyModel"> | string | null
    secretRef?: StringNullableFilter<"ModelProxyModel"> | string | null
    requestOptions?: JsonNullableFilter<"ModelProxyModel">
    createdAt?: DateTimeFilter<"ModelProxyModel"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxyModel"> | Date | string
  }, "id" | "modelName">

  export type ModelProxyModelOrderByWithAggregationInput = {
    id?: SortOrder
    modelName?: SortOrder
    enabled?: SortOrder
    displayName?: SortOrderInput | SortOrder
    family?: SortOrderInput | SortOrder
    ownedBy?: SortOrderInput | SortOrder
    apiMode?: SortOrderInput | SortOrder
    vision?: SortOrderInput | SortOrder
    contextWindowSize?: SortOrderInput | SortOrder
    maxOutputTokens?: SortOrderInput | SortOrder
    inputCostPerToken?: SortOrderInput | SortOrder
    outputCostPerToken?: SortOrderInput | SortOrder
    upstreamModel?: SortOrderInput | SortOrder
    upstreamBaseUrl?: SortOrderInput | SortOrder
    credentialName?: SortOrderInput | SortOrder
    secretRef?: SortOrderInput | SortOrder
    requestOptions?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ModelProxyModelCountOrderByAggregateInput
    _avg?: ModelProxyModelAvgOrderByAggregateInput
    _max?: ModelProxyModelMaxOrderByAggregateInput
    _min?: ModelProxyModelMinOrderByAggregateInput
    _sum?: ModelProxyModelSumOrderByAggregateInput
  }

  export type ModelProxyModelScalarWhereWithAggregatesInput = {
    AND?: ModelProxyModelScalarWhereWithAggregatesInput | ModelProxyModelScalarWhereWithAggregatesInput[]
    OR?: ModelProxyModelScalarWhereWithAggregatesInput[]
    NOT?: ModelProxyModelScalarWhereWithAggregatesInput | ModelProxyModelScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxyModel"> | string
    modelName?: StringWithAggregatesFilter<"ModelProxyModel"> | string
    enabled?: BoolWithAggregatesFilter<"ModelProxyModel"> | boolean
    displayName?: StringNullableWithAggregatesFilter<"ModelProxyModel"> | string | null
    family?: StringNullableWithAggregatesFilter<"ModelProxyModel"> | string | null
    ownedBy?: StringNullableWithAggregatesFilter<"ModelProxyModel"> | string | null
    apiMode?: StringNullableWithAggregatesFilter<"ModelProxyModel"> | string | null
    vision?: BoolNullableWithAggregatesFilter<"ModelProxyModel"> | boolean | null
    contextWindowSize?: IntNullableWithAggregatesFilter<"ModelProxyModel"> | number | null
    maxOutputTokens?: IntNullableWithAggregatesFilter<"ModelProxyModel"> | number | null
    inputCostPerToken?: FloatNullableWithAggregatesFilter<"ModelProxyModel"> | number | null
    outputCostPerToken?: FloatNullableWithAggregatesFilter<"ModelProxyModel"> | number | null
    upstreamModel?: StringNullableWithAggregatesFilter<"ModelProxyModel"> | string | null
    upstreamBaseUrl?: StringNullableWithAggregatesFilter<"ModelProxyModel"> | string | null
    credentialName?: StringNullableWithAggregatesFilter<"ModelProxyModel"> | string | null
    secretRef?: StringNullableWithAggregatesFilter<"ModelProxyModel"> | string | null
    requestOptions?: JsonNullableWithAggregatesFilter<"ModelProxyModel">
    createdAt?: DateTimeWithAggregatesFilter<"ModelProxyModel"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ModelProxyModel"> | Date | string
  }

  export type ModelProxyCredentialWhereInput = {
    AND?: ModelProxyCredentialWhereInput | ModelProxyCredentialWhereInput[]
    OR?: ModelProxyCredentialWhereInput[]
    NOT?: ModelProxyCredentialWhereInput | ModelProxyCredentialWhereInput[]
    id?: StringFilter<"ModelProxyCredential"> | string
    name?: StringFilter<"ModelProxyCredential"> | string
    provider?: StringNullableFilter<"ModelProxyCredential"> | string | null
    baseUrl?: StringNullableFilter<"ModelProxyCredential"> | string | null
    apiKey?: StringNullableFilter<"ModelProxyCredential"> | string | null
    secretRef?: StringNullableFilter<"ModelProxyCredential"> | string | null
    createdAt?: DateTimeFilter<"ModelProxyCredential"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxyCredential"> | Date | string
  }

  export type ModelProxyCredentialOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    provider?: SortOrderInput | SortOrder
    baseUrl?: SortOrderInput | SortOrder
    apiKey?: SortOrderInput | SortOrder
    secretRef?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyCredentialWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: ModelProxyCredentialWhereInput | ModelProxyCredentialWhereInput[]
    OR?: ModelProxyCredentialWhereInput[]
    NOT?: ModelProxyCredentialWhereInput | ModelProxyCredentialWhereInput[]
    provider?: StringNullableFilter<"ModelProxyCredential"> | string | null
    baseUrl?: StringNullableFilter<"ModelProxyCredential"> | string | null
    apiKey?: StringNullableFilter<"ModelProxyCredential"> | string | null
    secretRef?: StringNullableFilter<"ModelProxyCredential"> | string | null
    createdAt?: DateTimeFilter<"ModelProxyCredential"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxyCredential"> | Date | string
  }, "id" | "name">

  export type ModelProxyCredentialOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    provider?: SortOrderInput | SortOrder
    baseUrl?: SortOrderInput | SortOrder
    apiKey?: SortOrderInput | SortOrder
    secretRef?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ModelProxyCredentialCountOrderByAggregateInput
    _max?: ModelProxyCredentialMaxOrderByAggregateInput
    _min?: ModelProxyCredentialMinOrderByAggregateInput
  }

  export type ModelProxyCredentialScalarWhereWithAggregatesInput = {
    AND?: ModelProxyCredentialScalarWhereWithAggregatesInput | ModelProxyCredentialScalarWhereWithAggregatesInput[]
    OR?: ModelProxyCredentialScalarWhereWithAggregatesInput[]
    NOT?: ModelProxyCredentialScalarWhereWithAggregatesInput | ModelProxyCredentialScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxyCredential"> | string
    name?: StringWithAggregatesFilter<"ModelProxyCredential"> | string
    provider?: StringNullableWithAggregatesFilter<"ModelProxyCredential"> | string | null
    baseUrl?: StringNullableWithAggregatesFilter<"ModelProxyCredential"> | string | null
    apiKey?: StringNullableWithAggregatesFilter<"ModelProxyCredential"> | string | null
    secretRef?: StringNullableWithAggregatesFilter<"ModelProxyCredential"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ModelProxyCredential"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ModelProxyCredential"> | Date | string
  }

  export type ModelProxyApiKeyWhereInput = {
    AND?: ModelProxyApiKeyWhereInput | ModelProxyApiKeyWhereInput[]
    OR?: ModelProxyApiKeyWhereInput[]
    NOT?: ModelProxyApiKeyWhereInput | ModelProxyApiKeyWhereInput[]
    id?: StringFilter<"ModelProxyApiKey"> | string
    label?: StringFilter<"ModelProxyApiKey"> | string
    keyHash?: StringFilter<"ModelProxyApiKey"> | string
    enabled?: BoolFilter<"ModelProxyApiKey"> | boolean
    lastUsedAt?: DateTimeNullableFilter<"ModelProxyApiKey"> | Date | string | null
    createdAt?: DateTimeFilter<"ModelProxyApiKey"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxyApiKey"> | Date | string
  }

  export type ModelProxyApiKeyOrderByWithRelationInput = {
    id?: SortOrder
    label?: SortOrder
    keyHash?: SortOrder
    enabled?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyApiKeyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    keyHash?: string
    AND?: ModelProxyApiKeyWhereInput | ModelProxyApiKeyWhereInput[]
    OR?: ModelProxyApiKeyWhereInput[]
    NOT?: ModelProxyApiKeyWhereInput | ModelProxyApiKeyWhereInput[]
    label?: StringFilter<"ModelProxyApiKey"> | string
    enabled?: BoolFilter<"ModelProxyApiKey"> | boolean
    lastUsedAt?: DateTimeNullableFilter<"ModelProxyApiKey"> | Date | string | null
    createdAt?: DateTimeFilter<"ModelProxyApiKey"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxyApiKey"> | Date | string
  }, "id" | "keyHash">

  export type ModelProxyApiKeyOrderByWithAggregationInput = {
    id?: SortOrder
    label?: SortOrder
    keyHash?: SortOrder
    enabled?: SortOrder
    lastUsedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ModelProxyApiKeyCountOrderByAggregateInput
    _max?: ModelProxyApiKeyMaxOrderByAggregateInput
    _min?: ModelProxyApiKeyMinOrderByAggregateInput
  }

  export type ModelProxyApiKeyScalarWhereWithAggregatesInput = {
    AND?: ModelProxyApiKeyScalarWhereWithAggregatesInput | ModelProxyApiKeyScalarWhereWithAggregatesInput[]
    OR?: ModelProxyApiKeyScalarWhereWithAggregatesInput[]
    NOT?: ModelProxyApiKeyScalarWhereWithAggregatesInput | ModelProxyApiKeyScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxyApiKey"> | string
    label?: StringWithAggregatesFilter<"ModelProxyApiKey"> | string
    keyHash?: StringWithAggregatesFilter<"ModelProxyApiKey"> | string
    enabled?: BoolWithAggregatesFilter<"ModelProxyApiKey"> | boolean
    lastUsedAt?: DateTimeNullableWithAggregatesFilter<"ModelProxyApiKey"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ModelProxyApiKey"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ModelProxyApiKey"> | Date | string
  }

  export type ModelProxySettingWhereInput = {
    AND?: ModelProxySettingWhereInput | ModelProxySettingWhereInput[]
    OR?: ModelProxySettingWhereInput[]
    NOT?: ModelProxySettingWhereInput | ModelProxySettingWhereInput[]
    id?: StringFilter<"ModelProxySetting"> | string
    key?: StringFilter<"ModelProxySetting"> | string
    value?: JsonFilter<"ModelProxySetting">
    createdAt?: DateTimeFilter<"ModelProxySetting"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxySetting"> | Date | string
  }

  export type ModelProxySettingOrderByWithRelationInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxySettingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    key?: string
    AND?: ModelProxySettingWhereInput | ModelProxySettingWhereInput[]
    OR?: ModelProxySettingWhereInput[]
    NOT?: ModelProxySettingWhereInput | ModelProxySettingWhereInput[]
    value?: JsonFilter<"ModelProxySetting">
    createdAt?: DateTimeFilter<"ModelProxySetting"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxySetting"> | Date | string
  }, "id" | "key">

  export type ModelProxySettingOrderByWithAggregationInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ModelProxySettingCountOrderByAggregateInput
    _max?: ModelProxySettingMaxOrderByAggregateInput
    _min?: ModelProxySettingMinOrderByAggregateInput
  }

  export type ModelProxySettingScalarWhereWithAggregatesInput = {
    AND?: ModelProxySettingScalarWhereWithAggregatesInput | ModelProxySettingScalarWhereWithAggregatesInput[]
    OR?: ModelProxySettingScalarWhereWithAggregatesInput[]
    NOT?: ModelProxySettingScalarWhereWithAggregatesInput | ModelProxySettingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxySetting"> | string
    key?: StringWithAggregatesFilter<"ModelProxySetting"> | string
    value?: JsonWithAggregatesFilter<"ModelProxySetting">
    createdAt?: DateTimeWithAggregatesFilter<"ModelProxySetting"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ModelProxySetting"> | Date | string
  }

  export type ModelProxyAliasWhereInput = {
    AND?: ModelProxyAliasWhereInput | ModelProxyAliasWhereInput[]
    OR?: ModelProxyAliasWhereInput[]
    NOT?: ModelProxyAliasWhereInput | ModelProxyAliasWhereInput[]
    id?: StringFilter<"ModelProxyAlias"> | string
    alias?: StringFilter<"ModelProxyAlias"> | string
    targetModel?: StringFilter<"ModelProxyAlias"> | string
    createdAt?: DateTimeFilter<"ModelProxyAlias"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxyAlias"> | Date | string
  }

  export type ModelProxyAliasOrderByWithRelationInput = {
    id?: SortOrder
    alias?: SortOrder
    targetModel?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyAliasWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    alias?: string
    AND?: ModelProxyAliasWhereInput | ModelProxyAliasWhereInput[]
    OR?: ModelProxyAliasWhereInput[]
    NOT?: ModelProxyAliasWhereInput | ModelProxyAliasWhereInput[]
    targetModel?: StringFilter<"ModelProxyAlias"> | string
    createdAt?: DateTimeFilter<"ModelProxyAlias"> | Date | string
    updatedAt?: DateTimeFilter<"ModelProxyAlias"> | Date | string
  }, "id" | "alias">

  export type ModelProxyAliasOrderByWithAggregationInput = {
    id?: SortOrder
    alias?: SortOrder
    targetModel?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ModelProxyAliasCountOrderByAggregateInput
    _max?: ModelProxyAliasMaxOrderByAggregateInput
    _min?: ModelProxyAliasMinOrderByAggregateInput
  }

  export type ModelProxyAliasScalarWhereWithAggregatesInput = {
    AND?: ModelProxyAliasScalarWhereWithAggregatesInput | ModelProxyAliasScalarWhereWithAggregatesInput[]
    OR?: ModelProxyAliasScalarWhereWithAggregatesInput[]
    NOT?: ModelProxyAliasScalarWhereWithAggregatesInput | ModelProxyAliasScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxyAlias"> | string
    alias?: StringWithAggregatesFilter<"ModelProxyAlias"> | string
    targetModel?: StringWithAggregatesFilter<"ModelProxyAlias"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ModelProxyAlias"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ModelProxyAlias"> | Date | string
  }

  export type ModelProxyImportJobWhereInput = {
    AND?: ModelProxyImportJobWhereInput | ModelProxyImportJobWhereInput[]
    OR?: ModelProxyImportJobWhereInput[]
    NOT?: ModelProxyImportJobWhereInput | ModelProxyImportJobWhereInput[]
    id?: StringFilter<"ModelProxyImportJob"> | string
    source?: StringFilter<"ModelProxyImportJob"> | string
    status?: StringFilter<"ModelProxyImportJob"> | string
    startedAt?: DateTimeFilter<"ModelProxyImportJob"> | Date | string
    finishedAt?: DateTimeNullableFilter<"ModelProxyImportJob"> | Date | string | null
    summary?: JsonNullableFilter<"ModelProxyImportJob">
    error?: StringNullableFilter<"ModelProxyImportJob"> | string | null
  }

  export type ModelProxyImportJobOrderByWithRelationInput = {
    id?: SortOrder
    source?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrderInput | SortOrder
    summary?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
  }

  export type ModelProxyImportJobWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ModelProxyImportJobWhereInput | ModelProxyImportJobWhereInput[]
    OR?: ModelProxyImportJobWhereInput[]
    NOT?: ModelProxyImportJobWhereInput | ModelProxyImportJobWhereInput[]
    source?: StringFilter<"ModelProxyImportJob"> | string
    status?: StringFilter<"ModelProxyImportJob"> | string
    startedAt?: DateTimeFilter<"ModelProxyImportJob"> | Date | string
    finishedAt?: DateTimeNullableFilter<"ModelProxyImportJob"> | Date | string | null
    summary?: JsonNullableFilter<"ModelProxyImportJob">
    error?: StringNullableFilter<"ModelProxyImportJob"> | string | null
  }, "id">

  export type ModelProxyImportJobOrderByWithAggregationInput = {
    id?: SortOrder
    source?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrderInput | SortOrder
    summary?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    _count?: ModelProxyImportJobCountOrderByAggregateInput
    _max?: ModelProxyImportJobMaxOrderByAggregateInput
    _min?: ModelProxyImportJobMinOrderByAggregateInput
  }

  export type ModelProxyImportJobScalarWhereWithAggregatesInput = {
    AND?: ModelProxyImportJobScalarWhereWithAggregatesInput | ModelProxyImportJobScalarWhereWithAggregatesInput[]
    OR?: ModelProxyImportJobScalarWhereWithAggregatesInput[]
    NOT?: ModelProxyImportJobScalarWhereWithAggregatesInput | ModelProxyImportJobScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ModelProxyImportJob"> | string
    source?: StringWithAggregatesFilter<"ModelProxyImportJob"> | string
    status?: StringWithAggregatesFilter<"ModelProxyImportJob"> | string
    startedAt?: DateTimeWithAggregatesFilter<"ModelProxyImportJob"> | Date | string
    finishedAt?: DateTimeNullableWithAggregatesFilter<"ModelProxyImportJob"> | Date | string | null
    summary?: JsonNullableWithAggregatesFilter<"ModelProxyImportJob">
    error?: StringNullableWithAggregatesFilter<"ModelProxyImportJob"> | string | null
  }

  export type ModelProxyRequestCreateInput = {
    id?: string
    upstreamRequestId?: string | null
    model: string
    upstreamModel: string
    upstreamBaseUrl: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    latencyMs?: number | null
    ttftMs?: number | null
    inputTokens?: number | null
    outputTokens?: number | null
    totalTokens?: number | null
    cachedTokens?: number | null
    reasoningTokens?: number | null
    usageEstimated?: boolean | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    inputCost?: number | null
    outputCost?: number | null
    totalCost?: number | null
    costEstimated?: boolean | null
    estimatedCostUsd?: number | null
    errorSummary?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorStatusCode?: number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: string | null
    endUser?: string | null
    messages?: ModelProxyMessageCreateNestedManyWithoutRequestInput
    usageAdjustments?: ModelProxyUsageAdjustmentCreateNestedManyWithoutRequestInput
  }

  export type ModelProxyRequestUncheckedCreateInput = {
    id?: string
    upstreamRequestId?: string | null
    model: string
    upstreamModel: string
    upstreamBaseUrl: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    latencyMs?: number | null
    ttftMs?: number | null
    inputTokens?: number | null
    outputTokens?: number | null
    totalTokens?: number | null
    cachedTokens?: number | null
    reasoningTokens?: number | null
    usageEstimated?: boolean | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    inputCost?: number | null
    outputCost?: number | null
    totalCost?: number | null
    costEstimated?: boolean | null
    estimatedCostUsd?: number | null
    errorSummary?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorStatusCode?: number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: string | null
    endUser?: string | null
    messages?: ModelProxyMessageUncheckedCreateNestedManyWithoutRequestInput
    usageAdjustments?: ModelProxyUsageAdjustmentUncheckedCreateNestedManyWithoutRequestInput
  }

  export type ModelProxyRequestUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    upstreamRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    model?: StringFieldUpdateOperationsInput | string
    upstreamModel?: StringFieldUpdateOperationsInput | string
    upstreamBaseUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    ttftMs?: NullableIntFieldUpdateOperationsInput | number | null
    inputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    outputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    totalTokens?: NullableIntFieldUpdateOperationsInput | number | null
    cachedTokens?: NullableIntFieldUpdateOperationsInput | number | null
    reasoningTokens?: NullableIntFieldUpdateOperationsInput | number | null
    usageEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    inputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    totalCost?: NullableFloatFieldUpdateOperationsInput | number | null
    costEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    estimatedCostUsd?: NullableFloatFieldUpdateOperationsInput | number | null
    errorSummary?: NullableStringFieldUpdateOperationsInput | string | null
    errorType?: NullableStringFieldUpdateOperationsInput | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorStatusCode?: NullableIntFieldUpdateOperationsInput | number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: NullableStringFieldUpdateOperationsInput | string | null
    endUser?: NullableStringFieldUpdateOperationsInput | string | null
    messages?: ModelProxyMessageUpdateManyWithoutRequestNestedInput
    usageAdjustments?: ModelProxyUsageAdjustmentUpdateManyWithoutRequestNestedInput
  }

  export type ModelProxyRequestUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    upstreamRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    model?: StringFieldUpdateOperationsInput | string
    upstreamModel?: StringFieldUpdateOperationsInput | string
    upstreamBaseUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    ttftMs?: NullableIntFieldUpdateOperationsInput | number | null
    inputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    outputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    totalTokens?: NullableIntFieldUpdateOperationsInput | number | null
    cachedTokens?: NullableIntFieldUpdateOperationsInput | number | null
    reasoningTokens?: NullableIntFieldUpdateOperationsInput | number | null
    usageEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    inputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    totalCost?: NullableFloatFieldUpdateOperationsInput | number | null
    costEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    estimatedCostUsd?: NullableFloatFieldUpdateOperationsInput | number | null
    errorSummary?: NullableStringFieldUpdateOperationsInput | string | null
    errorType?: NullableStringFieldUpdateOperationsInput | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorStatusCode?: NullableIntFieldUpdateOperationsInput | number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: NullableStringFieldUpdateOperationsInput | string | null
    endUser?: NullableStringFieldUpdateOperationsInput | string | null
    messages?: ModelProxyMessageUncheckedUpdateManyWithoutRequestNestedInput
    usageAdjustments?: ModelProxyUsageAdjustmentUncheckedUpdateManyWithoutRequestNestedInput
  }

  export type ModelProxyRequestCreateManyInput = {
    id?: string
    upstreamRequestId?: string | null
    model: string
    upstreamModel: string
    upstreamBaseUrl: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    latencyMs?: number | null
    ttftMs?: number | null
    inputTokens?: number | null
    outputTokens?: number | null
    totalTokens?: number | null
    cachedTokens?: number | null
    reasoningTokens?: number | null
    usageEstimated?: boolean | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    inputCost?: number | null
    outputCost?: number | null
    totalCost?: number | null
    costEstimated?: boolean | null
    estimatedCostUsd?: number | null
    errorSummary?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorStatusCode?: number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: string | null
    endUser?: string | null
  }

  export type ModelProxyRequestUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    upstreamRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    model?: StringFieldUpdateOperationsInput | string
    upstreamModel?: StringFieldUpdateOperationsInput | string
    upstreamBaseUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    ttftMs?: NullableIntFieldUpdateOperationsInput | number | null
    inputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    outputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    totalTokens?: NullableIntFieldUpdateOperationsInput | number | null
    cachedTokens?: NullableIntFieldUpdateOperationsInput | number | null
    reasoningTokens?: NullableIntFieldUpdateOperationsInput | number | null
    usageEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    inputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    totalCost?: NullableFloatFieldUpdateOperationsInput | number | null
    costEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    estimatedCostUsd?: NullableFloatFieldUpdateOperationsInput | number | null
    errorSummary?: NullableStringFieldUpdateOperationsInput | string | null
    errorType?: NullableStringFieldUpdateOperationsInput | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorStatusCode?: NullableIntFieldUpdateOperationsInput | number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: NullableStringFieldUpdateOperationsInput | string | null
    endUser?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ModelProxyRequestUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    upstreamRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    model?: StringFieldUpdateOperationsInput | string
    upstreamModel?: StringFieldUpdateOperationsInput | string
    upstreamBaseUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    ttftMs?: NullableIntFieldUpdateOperationsInput | number | null
    inputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    outputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    totalTokens?: NullableIntFieldUpdateOperationsInput | number | null
    cachedTokens?: NullableIntFieldUpdateOperationsInput | number | null
    reasoningTokens?: NullableIntFieldUpdateOperationsInput | number | null
    usageEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    inputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    totalCost?: NullableFloatFieldUpdateOperationsInput | number | null
    costEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    estimatedCostUsd?: NullableFloatFieldUpdateOperationsInput | number | null
    errorSummary?: NullableStringFieldUpdateOperationsInput | string | null
    errorType?: NullableStringFieldUpdateOperationsInput | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorStatusCode?: NullableIntFieldUpdateOperationsInput | number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: NullableStringFieldUpdateOperationsInput | string | null
    endUser?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ModelProxyUsageAdjustmentCreateInput = {
    id?: string
    reason: string
    promptTokensDelta?: number
    completionTokensDelta?: number
    totalCostDelta?: number
    note?: string | null
    createdAt?: Date | string
    request: ModelProxyRequestCreateNestedOneWithoutUsageAdjustmentsInput
  }

  export type ModelProxyUsageAdjustmentUncheckedCreateInput = {
    id?: string
    requestId: string
    reason: string
    promptTokensDelta?: number
    completionTokensDelta?: number
    totalCostDelta?: number
    note?: string | null
    createdAt?: Date | string
  }

  export type ModelProxyUsageAdjustmentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    promptTokensDelta?: IntFieldUpdateOperationsInput | number
    completionTokensDelta?: IntFieldUpdateOperationsInput | number
    totalCostDelta?: FloatFieldUpdateOperationsInput | number
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    request?: ModelProxyRequestUpdateOneRequiredWithoutUsageAdjustmentsNestedInput
  }

  export type ModelProxyUsageAdjustmentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    promptTokensDelta?: IntFieldUpdateOperationsInput | number
    completionTokensDelta?: IntFieldUpdateOperationsInput | number
    totalCostDelta?: FloatFieldUpdateOperationsInput | number
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyUsageAdjustmentCreateManyInput = {
    id?: string
    requestId: string
    reason: string
    promptTokensDelta?: number
    completionTokensDelta?: number
    totalCostDelta?: number
    note?: string | null
    createdAt?: Date | string
  }

  export type ModelProxyUsageAdjustmentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    promptTokensDelta?: IntFieldUpdateOperationsInput | number
    completionTokensDelta?: IntFieldUpdateOperationsInput | number
    totalCostDelta?: FloatFieldUpdateOperationsInput | number
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyUsageAdjustmentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestId?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    promptTokensDelta?: IntFieldUpdateOperationsInput | number
    completionTokensDelta?: IntFieldUpdateOperationsInput | number
    totalCostDelta?: FloatFieldUpdateOperationsInput | number
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyMessageCreateInput = {
    id?: string
    role: string
    content: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    request: ModelProxyRequestCreateNestedOneWithoutMessagesInput
  }

  export type ModelProxyMessageUncheckedCreateInput = {
    id?: string
    requestId: string
    role: string
    content: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ModelProxyMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    request?: ModelProxyRequestUpdateOneRequiredWithoutMessagesNestedInput
  }

  export type ModelProxyMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyMessageCreateManyInput = {
    id?: string
    requestId: string
    role: string
    content: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ModelProxyMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    requestId?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyModelCreateInput = {
    id?: string
    modelName: string
    enabled?: boolean
    displayName?: string | null
    family?: string | null
    ownedBy?: string | null
    apiMode?: string | null
    vision?: boolean | null
    contextWindowSize?: number | null
    maxOutputTokens?: number | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    upstreamModel?: string | null
    upstreamBaseUrl?: string | null
    credentialName?: string | null
    secretRef?: string | null
    requestOptions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyModelUncheckedCreateInput = {
    id?: string
    modelName: string
    enabled?: boolean
    displayName?: string | null
    family?: string | null
    ownedBy?: string | null
    apiMode?: string | null
    vision?: boolean | null
    contextWindowSize?: number | null
    maxOutputTokens?: number | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    upstreamModel?: string | null
    upstreamBaseUrl?: string | null
    credentialName?: string | null
    secretRef?: string | null
    requestOptions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyModelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    family?: NullableStringFieldUpdateOperationsInput | string | null
    ownedBy?: NullableStringFieldUpdateOperationsInput | string | null
    apiMode?: NullableStringFieldUpdateOperationsInput | string | null
    vision?: NullableBoolFieldUpdateOperationsInput | boolean | null
    contextWindowSize?: NullableIntFieldUpdateOperationsInput | number | null
    maxOutputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    upstreamModel?: NullableStringFieldUpdateOperationsInput | string | null
    upstreamBaseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    credentialName?: NullableStringFieldUpdateOperationsInput | string | null
    secretRef?: NullableStringFieldUpdateOperationsInput | string | null
    requestOptions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyModelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    family?: NullableStringFieldUpdateOperationsInput | string | null
    ownedBy?: NullableStringFieldUpdateOperationsInput | string | null
    apiMode?: NullableStringFieldUpdateOperationsInput | string | null
    vision?: NullableBoolFieldUpdateOperationsInput | boolean | null
    contextWindowSize?: NullableIntFieldUpdateOperationsInput | number | null
    maxOutputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    upstreamModel?: NullableStringFieldUpdateOperationsInput | string | null
    upstreamBaseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    credentialName?: NullableStringFieldUpdateOperationsInput | string | null
    secretRef?: NullableStringFieldUpdateOperationsInput | string | null
    requestOptions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyModelCreateManyInput = {
    id?: string
    modelName: string
    enabled?: boolean
    displayName?: string | null
    family?: string | null
    ownedBy?: string | null
    apiMode?: string | null
    vision?: boolean | null
    contextWindowSize?: number | null
    maxOutputTokens?: number | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    upstreamModel?: string | null
    upstreamBaseUrl?: string | null
    credentialName?: string | null
    secretRef?: string | null
    requestOptions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyModelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    family?: NullableStringFieldUpdateOperationsInput | string | null
    ownedBy?: NullableStringFieldUpdateOperationsInput | string | null
    apiMode?: NullableStringFieldUpdateOperationsInput | string | null
    vision?: NullableBoolFieldUpdateOperationsInput | boolean | null
    contextWindowSize?: NullableIntFieldUpdateOperationsInput | number | null
    maxOutputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    upstreamModel?: NullableStringFieldUpdateOperationsInput | string | null
    upstreamBaseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    credentialName?: NullableStringFieldUpdateOperationsInput | string | null
    secretRef?: NullableStringFieldUpdateOperationsInput | string | null
    requestOptions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyModelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelName?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    displayName?: NullableStringFieldUpdateOperationsInput | string | null
    family?: NullableStringFieldUpdateOperationsInput | string | null
    ownedBy?: NullableStringFieldUpdateOperationsInput | string | null
    apiMode?: NullableStringFieldUpdateOperationsInput | string | null
    vision?: NullableBoolFieldUpdateOperationsInput | boolean | null
    contextWindowSize?: NullableIntFieldUpdateOperationsInput | number | null
    maxOutputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    upstreamModel?: NullableStringFieldUpdateOperationsInput | string | null
    upstreamBaseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    credentialName?: NullableStringFieldUpdateOperationsInput | string | null
    secretRef?: NullableStringFieldUpdateOperationsInput | string | null
    requestOptions?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyCredentialCreateInput = {
    id?: string
    name: string
    provider?: string | null
    baseUrl?: string | null
    apiKey?: string | null
    secretRef?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyCredentialUncheckedCreateInput = {
    id?: string
    name: string
    provider?: string | null
    baseUrl?: string | null
    apiKey?: string | null
    secretRef?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyCredentialUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    secretRef?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyCredentialUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    secretRef?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyCredentialCreateManyInput = {
    id?: string
    name: string
    provider?: string | null
    baseUrl?: string | null
    apiKey?: string | null
    secretRef?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyCredentialUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    secretRef?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyCredentialUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    provider?: NullableStringFieldUpdateOperationsInput | string | null
    baseUrl?: NullableStringFieldUpdateOperationsInput | string | null
    apiKey?: NullableStringFieldUpdateOperationsInput | string | null
    secretRef?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyApiKeyCreateInput = {
    id?: string
    label: string
    keyHash: string
    enabled?: boolean
    lastUsedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyApiKeyUncheckedCreateInput = {
    id?: string
    label: string
    keyHash: string
    enabled?: boolean
    lastUsedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyApiKeyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyApiKeyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyApiKeyCreateManyInput = {
    id?: string
    label: string
    keyHash: string
    enabled?: boolean
    lastUsedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyApiKeyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyApiKeyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    label?: StringFieldUpdateOperationsInput | string
    keyHash?: StringFieldUpdateOperationsInput | string
    enabled?: BoolFieldUpdateOperationsInput | boolean
    lastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxySettingCreateInput = {
    id?: string
    key: string
    value: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxySettingUncheckedCreateInput = {
    id?: string
    key: string
    value: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxySettingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxySettingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxySettingCreateManyInput = {
    id?: string
    key: string
    value: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxySettingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxySettingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    key?: StringFieldUpdateOperationsInput | string
    value?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyAliasCreateInput = {
    id?: string
    alias: string
    targetModel: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyAliasUncheckedCreateInput = {
    id?: string
    alias: string
    targetModel: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyAliasUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    alias?: StringFieldUpdateOperationsInput | string
    targetModel?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyAliasUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    alias?: StringFieldUpdateOperationsInput | string
    targetModel?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyAliasCreateManyInput = {
    id?: string
    alias: string
    targetModel: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ModelProxyAliasUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    alias?: StringFieldUpdateOperationsInput | string
    targetModel?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyAliasUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    alias?: StringFieldUpdateOperationsInput | string
    targetModel?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyImportJobCreateInput = {
    id?: string
    source: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    summary?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
  }

  export type ModelProxyImportJobUncheckedCreateInput = {
    id?: string
    source: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    summary?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
  }

  export type ModelProxyImportJobUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    summary?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ModelProxyImportJobUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    summary?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ModelProxyImportJobCreateManyInput = {
    id?: string
    source: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    summary?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
  }

  export type ModelProxyImportJobUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    summary?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ModelProxyImportJobUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    summary?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ModelProxyMessageListRelationFilter = {
    every?: ModelProxyMessageWhereInput
    some?: ModelProxyMessageWhereInput
    none?: ModelProxyMessageWhereInput
  }

  export type ModelProxyUsageAdjustmentListRelationFilter = {
    every?: ModelProxyUsageAdjustmentWhereInput
    some?: ModelProxyUsageAdjustmentWhereInput
    none?: ModelProxyUsageAdjustmentWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ModelProxyMessageOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ModelProxyUsageAdjustmentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ModelProxyRequestCountOrderByAggregateInput = {
    id?: SortOrder
    upstreamRequestId?: SortOrder
    model?: SortOrder
    upstreamModel?: SortOrder
    upstreamBaseUrl?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    latencyMs?: SortOrder
    ttftMs?: SortOrder
    inputTokens?: SortOrder
    outputTokens?: SortOrder
    totalTokens?: SortOrder
    cachedTokens?: SortOrder
    reasoningTokens?: SortOrder
    usageEstimated?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
    inputCost?: SortOrder
    outputCost?: SortOrder
    totalCost?: SortOrder
    costEstimated?: SortOrder
    estimatedCostUsd?: SortOrder
    errorSummary?: SortOrder
    errorType?: SortOrder
    errorMessage?: SortOrder
    errorStatusCode?: SortOrder
    errorDetails?: SortOrder
    requestBody?: SortOrder
    responseBody?: SortOrder
    responseHeaders?: SortOrder
    apiKeyAlias?: SortOrder
    endUser?: SortOrder
  }

  export type ModelProxyRequestAvgOrderByAggregateInput = {
    latencyMs?: SortOrder
    ttftMs?: SortOrder
    inputTokens?: SortOrder
    outputTokens?: SortOrder
    totalTokens?: SortOrder
    cachedTokens?: SortOrder
    reasoningTokens?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
    inputCost?: SortOrder
    outputCost?: SortOrder
    totalCost?: SortOrder
    estimatedCostUsd?: SortOrder
    errorStatusCode?: SortOrder
  }

  export type ModelProxyRequestMaxOrderByAggregateInput = {
    id?: SortOrder
    upstreamRequestId?: SortOrder
    model?: SortOrder
    upstreamModel?: SortOrder
    upstreamBaseUrl?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    latencyMs?: SortOrder
    ttftMs?: SortOrder
    inputTokens?: SortOrder
    outputTokens?: SortOrder
    totalTokens?: SortOrder
    cachedTokens?: SortOrder
    reasoningTokens?: SortOrder
    usageEstimated?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
    inputCost?: SortOrder
    outputCost?: SortOrder
    totalCost?: SortOrder
    costEstimated?: SortOrder
    estimatedCostUsd?: SortOrder
    errorSummary?: SortOrder
    errorType?: SortOrder
    errorMessage?: SortOrder
    errorStatusCode?: SortOrder
    apiKeyAlias?: SortOrder
    endUser?: SortOrder
  }

  export type ModelProxyRequestMinOrderByAggregateInput = {
    id?: SortOrder
    upstreamRequestId?: SortOrder
    model?: SortOrder
    upstreamModel?: SortOrder
    upstreamBaseUrl?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    latencyMs?: SortOrder
    ttftMs?: SortOrder
    inputTokens?: SortOrder
    outputTokens?: SortOrder
    totalTokens?: SortOrder
    cachedTokens?: SortOrder
    reasoningTokens?: SortOrder
    usageEstimated?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
    inputCost?: SortOrder
    outputCost?: SortOrder
    totalCost?: SortOrder
    costEstimated?: SortOrder
    estimatedCostUsd?: SortOrder
    errorSummary?: SortOrder
    errorType?: SortOrder
    errorMessage?: SortOrder
    errorStatusCode?: SortOrder
    apiKeyAlias?: SortOrder
    endUser?: SortOrder
  }

  export type ModelProxyRequestSumOrderByAggregateInput = {
    latencyMs?: SortOrder
    ttftMs?: SortOrder
    inputTokens?: SortOrder
    outputTokens?: SortOrder
    totalTokens?: SortOrder
    cachedTokens?: SortOrder
    reasoningTokens?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
    inputCost?: SortOrder
    outputCost?: SortOrder
    totalCost?: SortOrder
    estimatedCostUsd?: SortOrder
    errorStatusCode?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type ModelProxyRequestScalarRelationFilter = {
    is?: ModelProxyRequestWhereInput
    isNot?: ModelProxyRequestWhereInput
  }

  export type ModelProxyUsageAdjustmentCountOrderByAggregateInput = {
    id?: SortOrder
    requestId?: SortOrder
    reason?: SortOrder
    promptTokensDelta?: SortOrder
    completionTokensDelta?: SortOrder
    totalCostDelta?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type ModelProxyUsageAdjustmentAvgOrderByAggregateInput = {
    promptTokensDelta?: SortOrder
    completionTokensDelta?: SortOrder
    totalCostDelta?: SortOrder
  }

  export type ModelProxyUsageAdjustmentMaxOrderByAggregateInput = {
    id?: SortOrder
    requestId?: SortOrder
    reason?: SortOrder
    promptTokensDelta?: SortOrder
    completionTokensDelta?: SortOrder
    totalCostDelta?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type ModelProxyUsageAdjustmentMinOrderByAggregateInput = {
    id?: SortOrder
    requestId?: SortOrder
    reason?: SortOrder
    promptTokensDelta?: SortOrder
    completionTokensDelta?: SortOrder
    totalCostDelta?: SortOrder
    note?: SortOrder
    createdAt?: SortOrder
  }

  export type ModelProxyUsageAdjustmentSumOrderByAggregateInput = {
    promptTokensDelta?: SortOrder
    completionTokensDelta?: SortOrder
    totalCostDelta?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type ModelProxyMessageCountOrderByAggregateInput = {
    id?: SortOrder
    requestId?: SortOrder
    role?: SortOrder
    content?: SortOrder
    createdAt?: SortOrder
  }

  export type ModelProxyMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    requestId?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type ModelProxyMessageMinOrderByAggregateInput = {
    id?: SortOrder
    requestId?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type ModelProxyModelCountOrderByAggregateInput = {
    id?: SortOrder
    modelName?: SortOrder
    enabled?: SortOrder
    displayName?: SortOrder
    family?: SortOrder
    ownedBy?: SortOrder
    apiMode?: SortOrder
    vision?: SortOrder
    contextWindowSize?: SortOrder
    maxOutputTokens?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
    upstreamModel?: SortOrder
    upstreamBaseUrl?: SortOrder
    credentialName?: SortOrder
    secretRef?: SortOrder
    requestOptions?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyModelAvgOrderByAggregateInput = {
    contextWindowSize?: SortOrder
    maxOutputTokens?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
  }

  export type ModelProxyModelMaxOrderByAggregateInput = {
    id?: SortOrder
    modelName?: SortOrder
    enabled?: SortOrder
    displayName?: SortOrder
    family?: SortOrder
    ownedBy?: SortOrder
    apiMode?: SortOrder
    vision?: SortOrder
    contextWindowSize?: SortOrder
    maxOutputTokens?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
    upstreamModel?: SortOrder
    upstreamBaseUrl?: SortOrder
    credentialName?: SortOrder
    secretRef?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyModelMinOrderByAggregateInput = {
    id?: SortOrder
    modelName?: SortOrder
    enabled?: SortOrder
    displayName?: SortOrder
    family?: SortOrder
    ownedBy?: SortOrder
    apiMode?: SortOrder
    vision?: SortOrder
    contextWindowSize?: SortOrder
    maxOutputTokens?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
    upstreamModel?: SortOrder
    upstreamBaseUrl?: SortOrder
    credentialName?: SortOrder
    secretRef?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyModelSumOrderByAggregateInput = {
    contextWindowSize?: SortOrder
    maxOutputTokens?: SortOrder
    inputCostPerToken?: SortOrder
    outputCostPerToken?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type ModelProxyCredentialCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    provider?: SortOrder
    baseUrl?: SortOrder
    apiKey?: SortOrder
    secretRef?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyCredentialMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    provider?: SortOrder
    baseUrl?: SortOrder
    apiKey?: SortOrder
    secretRef?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyCredentialMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    provider?: SortOrder
    baseUrl?: SortOrder
    apiKey?: SortOrder
    secretRef?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyApiKeyCountOrderByAggregateInput = {
    id?: SortOrder
    label?: SortOrder
    keyHash?: SortOrder
    enabled?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyApiKeyMaxOrderByAggregateInput = {
    id?: SortOrder
    label?: SortOrder
    keyHash?: SortOrder
    enabled?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyApiKeyMinOrderByAggregateInput = {
    id?: SortOrder
    label?: SortOrder
    keyHash?: SortOrder
    enabled?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxySettingCountOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    value?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxySettingMaxOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxySettingMinOrderByAggregateInput = {
    id?: SortOrder
    key?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyAliasCountOrderByAggregateInput = {
    id?: SortOrder
    alias?: SortOrder
    targetModel?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyAliasMaxOrderByAggregateInput = {
    id?: SortOrder
    alias?: SortOrder
    targetModel?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyAliasMinOrderByAggregateInput = {
    id?: SortOrder
    alias?: SortOrder
    targetModel?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ModelProxyImportJobCountOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    summary?: SortOrder
    error?: SortOrder
  }

  export type ModelProxyImportJobMaxOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    error?: SortOrder
  }

  export type ModelProxyImportJobMinOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    status?: SortOrder
    startedAt?: SortOrder
    finishedAt?: SortOrder
    error?: SortOrder
  }

  export type ModelProxyMessageCreateNestedManyWithoutRequestInput = {
    create?: XOR<ModelProxyMessageCreateWithoutRequestInput, ModelProxyMessageUncheckedCreateWithoutRequestInput> | ModelProxyMessageCreateWithoutRequestInput[] | ModelProxyMessageUncheckedCreateWithoutRequestInput[]
    connectOrCreate?: ModelProxyMessageCreateOrConnectWithoutRequestInput | ModelProxyMessageCreateOrConnectWithoutRequestInput[]
    createMany?: ModelProxyMessageCreateManyRequestInputEnvelope
    connect?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
  }

  export type ModelProxyUsageAdjustmentCreateNestedManyWithoutRequestInput = {
    create?: XOR<ModelProxyUsageAdjustmentCreateWithoutRequestInput, ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput> | ModelProxyUsageAdjustmentCreateWithoutRequestInput[] | ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput[]
    connectOrCreate?: ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput | ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput[]
    createMany?: ModelProxyUsageAdjustmentCreateManyRequestInputEnvelope
    connect?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
  }

  export type ModelProxyMessageUncheckedCreateNestedManyWithoutRequestInput = {
    create?: XOR<ModelProxyMessageCreateWithoutRequestInput, ModelProxyMessageUncheckedCreateWithoutRequestInput> | ModelProxyMessageCreateWithoutRequestInput[] | ModelProxyMessageUncheckedCreateWithoutRequestInput[]
    connectOrCreate?: ModelProxyMessageCreateOrConnectWithoutRequestInput | ModelProxyMessageCreateOrConnectWithoutRequestInput[]
    createMany?: ModelProxyMessageCreateManyRequestInputEnvelope
    connect?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
  }

  export type ModelProxyUsageAdjustmentUncheckedCreateNestedManyWithoutRequestInput = {
    create?: XOR<ModelProxyUsageAdjustmentCreateWithoutRequestInput, ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput> | ModelProxyUsageAdjustmentCreateWithoutRequestInput[] | ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput[]
    connectOrCreate?: ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput | ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput[]
    createMany?: ModelProxyUsageAdjustmentCreateManyRequestInputEnvelope
    connect?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ModelProxyMessageUpdateManyWithoutRequestNestedInput = {
    create?: XOR<ModelProxyMessageCreateWithoutRequestInput, ModelProxyMessageUncheckedCreateWithoutRequestInput> | ModelProxyMessageCreateWithoutRequestInput[] | ModelProxyMessageUncheckedCreateWithoutRequestInput[]
    connectOrCreate?: ModelProxyMessageCreateOrConnectWithoutRequestInput | ModelProxyMessageCreateOrConnectWithoutRequestInput[]
    upsert?: ModelProxyMessageUpsertWithWhereUniqueWithoutRequestInput | ModelProxyMessageUpsertWithWhereUniqueWithoutRequestInput[]
    createMany?: ModelProxyMessageCreateManyRequestInputEnvelope
    set?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
    disconnect?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
    delete?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
    connect?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
    update?: ModelProxyMessageUpdateWithWhereUniqueWithoutRequestInput | ModelProxyMessageUpdateWithWhereUniqueWithoutRequestInput[]
    updateMany?: ModelProxyMessageUpdateManyWithWhereWithoutRequestInput | ModelProxyMessageUpdateManyWithWhereWithoutRequestInput[]
    deleteMany?: ModelProxyMessageScalarWhereInput | ModelProxyMessageScalarWhereInput[]
  }

  export type ModelProxyUsageAdjustmentUpdateManyWithoutRequestNestedInput = {
    create?: XOR<ModelProxyUsageAdjustmentCreateWithoutRequestInput, ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput> | ModelProxyUsageAdjustmentCreateWithoutRequestInput[] | ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput[]
    connectOrCreate?: ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput | ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput[]
    upsert?: ModelProxyUsageAdjustmentUpsertWithWhereUniqueWithoutRequestInput | ModelProxyUsageAdjustmentUpsertWithWhereUniqueWithoutRequestInput[]
    createMany?: ModelProxyUsageAdjustmentCreateManyRequestInputEnvelope
    set?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
    disconnect?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
    delete?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
    connect?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
    update?: ModelProxyUsageAdjustmentUpdateWithWhereUniqueWithoutRequestInput | ModelProxyUsageAdjustmentUpdateWithWhereUniqueWithoutRequestInput[]
    updateMany?: ModelProxyUsageAdjustmentUpdateManyWithWhereWithoutRequestInput | ModelProxyUsageAdjustmentUpdateManyWithWhereWithoutRequestInput[]
    deleteMany?: ModelProxyUsageAdjustmentScalarWhereInput | ModelProxyUsageAdjustmentScalarWhereInput[]
  }

  export type ModelProxyMessageUncheckedUpdateManyWithoutRequestNestedInput = {
    create?: XOR<ModelProxyMessageCreateWithoutRequestInput, ModelProxyMessageUncheckedCreateWithoutRequestInput> | ModelProxyMessageCreateWithoutRequestInput[] | ModelProxyMessageUncheckedCreateWithoutRequestInput[]
    connectOrCreate?: ModelProxyMessageCreateOrConnectWithoutRequestInput | ModelProxyMessageCreateOrConnectWithoutRequestInput[]
    upsert?: ModelProxyMessageUpsertWithWhereUniqueWithoutRequestInput | ModelProxyMessageUpsertWithWhereUniqueWithoutRequestInput[]
    createMany?: ModelProxyMessageCreateManyRequestInputEnvelope
    set?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
    disconnect?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
    delete?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
    connect?: ModelProxyMessageWhereUniqueInput | ModelProxyMessageWhereUniqueInput[]
    update?: ModelProxyMessageUpdateWithWhereUniqueWithoutRequestInput | ModelProxyMessageUpdateWithWhereUniqueWithoutRequestInput[]
    updateMany?: ModelProxyMessageUpdateManyWithWhereWithoutRequestInput | ModelProxyMessageUpdateManyWithWhereWithoutRequestInput[]
    deleteMany?: ModelProxyMessageScalarWhereInput | ModelProxyMessageScalarWhereInput[]
  }

  export type ModelProxyUsageAdjustmentUncheckedUpdateManyWithoutRequestNestedInput = {
    create?: XOR<ModelProxyUsageAdjustmentCreateWithoutRequestInput, ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput> | ModelProxyUsageAdjustmentCreateWithoutRequestInput[] | ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput[]
    connectOrCreate?: ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput | ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput[]
    upsert?: ModelProxyUsageAdjustmentUpsertWithWhereUniqueWithoutRequestInput | ModelProxyUsageAdjustmentUpsertWithWhereUniqueWithoutRequestInput[]
    createMany?: ModelProxyUsageAdjustmentCreateManyRequestInputEnvelope
    set?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
    disconnect?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
    delete?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
    connect?: ModelProxyUsageAdjustmentWhereUniqueInput | ModelProxyUsageAdjustmentWhereUniqueInput[]
    update?: ModelProxyUsageAdjustmentUpdateWithWhereUniqueWithoutRequestInput | ModelProxyUsageAdjustmentUpdateWithWhereUniqueWithoutRequestInput[]
    updateMany?: ModelProxyUsageAdjustmentUpdateManyWithWhereWithoutRequestInput | ModelProxyUsageAdjustmentUpdateManyWithWhereWithoutRequestInput[]
    deleteMany?: ModelProxyUsageAdjustmentScalarWhereInput | ModelProxyUsageAdjustmentScalarWhereInput[]
  }

  export type ModelProxyRequestCreateNestedOneWithoutUsageAdjustmentsInput = {
    create?: XOR<ModelProxyRequestCreateWithoutUsageAdjustmentsInput, ModelProxyRequestUncheckedCreateWithoutUsageAdjustmentsInput>
    connectOrCreate?: ModelProxyRequestCreateOrConnectWithoutUsageAdjustmentsInput
    connect?: ModelProxyRequestWhereUniqueInput
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ModelProxyRequestUpdateOneRequiredWithoutUsageAdjustmentsNestedInput = {
    create?: XOR<ModelProxyRequestCreateWithoutUsageAdjustmentsInput, ModelProxyRequestUncheckedCreateWithoutUsageAdjustmentsInput>
    connectOrCreate?: ModelProxyRequestCreateOrConnectWithoutUsageAdjustmentsInput
    upsert?: ModelProxyRequestUpsertWithoutUsageAdjustmentsInput
    connect?: ModelProxyRequestWhereUniqueInput
    update?: XOR<XOR<ModelProxyRequestUpdateToOneWithWhereWithoutUsageAdjustmentsInput, ModelProxyRequestUpdateWithoutUsageAdjustmentsInput>, ModelProxyRequestUncheckedUpdateWithoutUsageAdjustmentsInput>
  }

  export type ModelProxyRequestCreateNestedOneWithoutMessagesInput = {
    create?: XOR<ModelProxyRequestCreateWithoutMessagesInput, ModelProxyRequestUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ModelProxyRequestCreateOrConnectWithoutMessagesInput
    connect?: ModelProxyRequestWhereUniqueInput
  }

  export type ModelProxyRequestUpdateOneRequiredWithoutMessagesNestedInput = {
    create?: XOR<ModelProxyRequestCreateWithoutMessagesInput, ModelProxyRequestUncheckedCreateWithoutMessagesInput>
    connectOrCreate?: ModelProxyRequestCreateOrConnectWithoutMessagesInput
    upsert?: ModelProxyRequestUpsertWithoutMessagesInput
    connect?: ModelProxyRequestWhereUniqueInput
    update?: XOR<XOR<ModelProxyRequestUpdateToOneWithWhereWithoutMessagesInput, ModelProxyRequestUpdateWithoutMessagesInput>, ModelProxyRequestUncheckedUpdateWithoutMessagesInput>
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBoolNullableFilter<$PrismaModel>
    _max?: NestedBoolNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type ModelProxyMessageCreateWithoutRequestInput = {
    id?: string
    role: string
    content: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ModelProxyMessageUncheckedCreateWithoutRequestInput = {
    id?: string
    role: string
    content: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ModelProxyMessageCreateOrConnectWithoutRequestInput = {
    where: ModelProxyMessageWhereUniqueInput
    create: XOR<ModelProxyMessageCreateWithoutRequestInput, ModelProxyMessageUncheckedCreateWithoutRequestInput>
  }

  export type ModelProxyMessageCreateManyRequestInputEnvelope = {
    data: ModelProxyMessageCreateManyRequestInput | ModelProxyMessageCreateManyRequestInput[]
    skipDuplicates?: boolean
  }

  export type ModelProxyUsageAdjustmentCreateWithoutRequestInput = {
    id?: string
    reason: string
    promptTokensDelta?: number
    completionTokensDelta?: number
    totalCostDelta?: number
    note?: string | null
    createdAt?: Date | string
  }

  export type ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput = {
    id?: string
    reason: string
    promptTokensDelta?: number
    completionTokensDelta?: number
    totalCostDelta?: number
    note?: string | null
    createdAt?: Date | string
  }

  export type ModelProxyUsageAdjustmentCreateOrConnectWithoutRequestInput = {
    where: ModelProxyUsageAdjustmentWhereUniqueInput
    create: XOR<ModelProxyUsageAdjustmentCreateWithoutRequestInput, ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput>
  }

  export type ModelProxyUsageAdjustmentCreateManyRequestInputEnvelope = {
    data: ModelProxyUsageAdjustmentCreateManyRequestInput | ModelProxyUsageAdjustmentCreateManyRequestInput[]
    skipDuplicates?: boolean
  }

  export type ModelProxyMessageUpsertWithWhereUniqueWithoutRequestInput = {
    where: ModelProxyMessageWhereUniqueInput
    update: XOR<ModelProxyMessageUpdateWithoutRequestInput, ModelProxyMessageUncheckedUpdateWithoutRequestInput>
    create: XOR<ModelProxyMessageCreateWithoutRequestInput, ModelProxyMessageUncheckedCreateWithoutRequestInput>
  }

  export type ModelProxyMessageUpdateWithWhereUniqueWithoutRequestInput = {
    where: ModelProxyMessageWhereUniqueInput
    data: XOR<ModelProxyMessageUpdateWithoutRequestInput, ModelProxyMessageUncheckedUpdateWithoutRequestInput>
  }

  export type ModelProxyMessageUpdateManyWithWhereWithoutRequestInput = {
    where: ModelProxyMessageScalarWhereInput
    data: XOR<ModelProxyMessageUpdateManyMutationInput, ModelProxyMessageUncheckedUpdateManyWithoutRequestInput>
  }

  export type ModelProxyMessageScalarWhereInput = {
    AND?: ModelProxyMessageScalarWhereInput | ModelProxyMessageScalarWhereInput[]
    OR?: ModelProxyMessageScalarWhereInput[]
    NOT?: ModelProxyMessageScalarWhereInput | ModelProxyMessageScalarWhereInput[]
    id?: StringFilter<"ModelProxyMessage"> | string
    requestId?: StringFilter<"ModelProxyMessage"> | string
    role?: StringFilter<"ModelProxyMessage"> | string
    content?: JsonFilter<"ModelProxyMessage">
    createdAt?: DateTimeFilter<"ModelProxyMessage"> | Date | string
  }

  export type ModelProxyUsageAdjustmentUpsertWithWhereUniqueWithoutRequestInput = {
    where: ModelProxyUsageAdjustmentWhereUniqueInput
    update: XOR<ModelProxyUsageAdjustmentUpdateWithoutRequestInput, ModelProxyUsageAdjustmentUncheckedUpdateWithoutRequestInput>
    create: XOR<ModelProxyUsageAdjustmentCreateWithoutRequestInput, ModelProxyUsageAdjustmentUncheckedCreateWithoutRequestInput>
  }

  export type ModelProxyUsageAdjustmentUpdateWithWhereUniqueWithoutRequestInput = {
    where: ModelProxyUsageAdjustmentWhereUniqueInput
    data: XOR<ModelProxyUsageAdjustmentUpdateWithoutRequestInput, ModelProxyUsageAdjustmentUncheckedUpdateWithoutRequestInput>
  }

  export type ModelProxyUsageAdjustmentUpdateManyWithWhereWithoutRequestInput = {
    where: ModelProxyUsageAdjustmentScalarWhereInput
    data: XOR<ModelProxyUsageAdjustmentUpdateManyMutationInput, ModelProxyUsageAdjustmentUncheckedUpdateManyWithoutRequestInput>
  }

  export type ModelProxyUsageAdjustmentScalarWhereInput = {
    AND?: ModelProxyUsageAdjustmentScalarWhereInput | ModelProxyUsageAdjustmentScalarWhereInput[]
    OR?: ModelProxyUsageAdjustmentScalarWhereInput[]
    NOT?: ModelProxyUsageAdjustmentScalarWhereInput | ModelProxyUsageAdjustmentScalarWhereInput[]
    id?: StringFilter<"ModelProxyUsageAdjustment"> | string
    requestId?: StringFilter<"ModelProxyUsageAdjustment"> | string
    reason?: StringFilter<"ModelProxyUsageAdjustment"> | string
    promptTokensDelta?: IntFilter<"ModelProxyUsageAdjustment"> | number
    completionTokensDelta?: IntFilter<"ModelProxyUsageAdjustment"> | number
    totalCostDelta?: FloatFilter<"ModelProxyUsageAdjustment"> | number
    note?: StringNullableFilter<"ModelProxyUsageAdjustment"> | string | null
    createdAt?: DateTimeFilter<"ModelProxyUsageAdjustment"> | Date | string
  }

  export type ModelProxyRequestCreateWithoutUsageAdjustmentsInput = {
    id?: string
    upstreamRequestId?: string | null
    model: string
    upstreamModel: string
    upstreamBaseUrl: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    latencyMs?: number | null
    ttftMs?: number | null
    inputTokens?: number | null
    outputTokens?: number | null
    totalTokens?: number | null
    cachedTokens?: number | null
    reasoningTokens?: number | null
    usageEstimated?: boolean | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    inputCost?: number | null
    outputCost?: number | null
    totalCost?: number | null
    costEstimated?: boolean | null
    estimatedCostUsd?: number | null
    errorSummary?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorStatusCode?: number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: string | null
    endUser?: string | null
    messages?: ModelProxyMessageCreateNestedManyWithoutRequestInput
  }

  export type ModelProxyRequestUncheckedCreateWithoutUsageAdjustmentsInput = {
    id?: string
    upstreamRequestId?: string | null
    model: string
    upstreamModel: string
    upstreamBaseUrl: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    latencyMs?: number | null
    ttftMs?: number | null
    inputTokens?: number | null
    outputTokens?: number | null
    totalTokens?: number | null
    cachedTokens?: number | null
    reasoningTokens?: number | null
    usageEstimated?: boolean | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    inputCost?: number | null
    outputCost?: number | null
    totalCost?: number | null
    costEstimated?: boolean | null
    estimatedCostUsd?: number | null
    errorSummary?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorStatusCode?: number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: string | null
    endUser?: string | null
    messages?: ModelProxyMessageUncheckedCreateNestedManyWithoutRequestInput
  }

  export type ModelProxyRequestCreateOrConnectWithoutUsageAdjustmentsInput = {
    where: ModelProxyRequestWhereUniqueInput
    create: XOR<ModelProxyRequestCreateWithoutUsageAdjustmentsInput, ModelProxyRequestUncheckedCreateWithoutUsageAdjustmentsInput>
  }

  export type ModelProxyRequestUpsertWithoutUsageAdjustmentsInput = {
    update: XOR<ModelProxyRequestUpdateWithoutUsageAdjustmentsInput, ModelProxyRequestUncheckedUpdateWithoutUsageAdjustmentsInput>
    create: XOR<ModelProxyRequestCreateWithoutUsageAdjustmentsInput, ModelProxyRequestUncheckedCreateWithoutUsageAdjustmentsInput>
    where?: ModelProxyRequestWhereInput
  }

  export type ModelProxyRequestUpdateToOneWithWhereWithoutUsageAdjustmentsInput = {
    where?: ModelProxyRequestWhereInput
    data: XOR<ModelProxyRequestUpdateWithoutUsageAdjustmentsInput, ModelProxyRequestUncheckedUpdateWithoutUsageAdjustmentsInput>
  }

  export type ModelProxyRequestUpdateWithoutUsageAdjustmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    upstreamRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    model?: StringFieldUpdateOperationsInput | string
    upstreamModel?: StringFieldUpdateOperationsInput | string
    upstreamBaseUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    ttftMs?: NullableIntFieldUpdateOperationsInput | number | null
    inputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    outputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    totalTokens?: NullableIntFieldUpdateOperationsInput | number | null
    cachedTokens?: NullableIntFieldUpdateOperationsInput | number | null
    reasoningTokens?: NullableIntFieldUpdateOperationsInput | number | null
    usageEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    inputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    totalCost?: NullableFloatFieldUpdateOperationsInput | number | null
    costEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    estimatedCostUsd?: NullableFloatFieldUpdateOperationsInput | number | null
    errorSummary?: NullableStringFieldUpdateOperationsInput | string | null
    errorType?: NullableStringFieldUpdateOperationsInput | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorStatusCode?: NullableIntFieldUpdateOperationsInput | number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: NullableStringFieldUpdateOperationsInput | string | null
    endUser?: NullableStringFieldUpdateOperationsInput | string | null
    messages?: ModelProxyMessageUpdateManyWithoutRequestNestedInput
  }

  export type ModelProxyRequestUncheckedUpdateWithoutUsageAdjustmentsInput = {
    id?: StringFieldUpdateOperationsInput | string
    upstreamRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    model?: StringFieldUpdateOperationsInput | string
    upstreamModel?: StringFieldUpdateOperationsInput | string
    upstreamBaseUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    ttftMs?: NullableIntFieldUpdateOperationsInput | number | null
    inputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    outputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    totalTokens?: NullableIntFieldUpdateOperationsInput | number | null
    cachedTokens?: NullableIntFieldUpdateOperationsInput | number | null
    reasoningTokens?: NullableIntFieldUpdateOperationsInput | number | null
    usageEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    inputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    totalCost?: NullableFloatFieldUpdateOperationsInput | number | null
    costEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    estimatedCostUsd?: NullableFloatFieldUpdateOperationsInput | number | null
    errorSummary?: NullableStringFieldUpdateOperationsInput | string | null
    errorType?: NullableStringFieldUpdateOperationsInput | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorStatusCode?: NullableIntFieldUpdateOperationsInput | number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: NullableStringFieldUpdateOperationsInput | string | null
    endUser?: NullableStringFieldUpdateOperationsInput | string | null
    messages?: ModelProxyMessageUncheckedUpdateManyWithoutRequestNestedInput
  }

  export type ModelProxyRequestCreateWithoutMessagesInput = {
    id?: string
    upstreamRequestId?: string | null
    model: string
    upstreamModel: string
    upstreamBaseUrl: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    latencyMs?: number | null
    ttftMs?: number | null
    inputTokens?: number | null
    outputTokens?: number | null
    totalTokens?: number | null
    cachedTokens?: number | null
    reasoningTokens?: number | null
    usageEstimated?: boolean | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    inputCost?: number | null
    outputCost?: number | null
    totalCost?: number | null
    costEstimated?: boolean | null
    estimatedCostUsd?: number | null
    errorSummary?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorStatusCode?: number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: string | null
    endUser?: string | null
    usageAdjustments?: ModelProxyUsageAdjustmentCreateNestedManyWithoutRequestInput
  }

  export type ModelProxyRequestUncheckedCreateWithoutMessagesInput = {
    id?: string
    upstreamRequestId?: string | null
    model: string
    upstreamModel: string
    upstreamBaseUrl: string
    status: string
    startedAt?: Date | string
    finishedAt?: Date | string | null
    latencyMs?: number | null
    ttftMs?: number | null
    inputTokens?: number | null
    outputTokens?: number | null
    totalTokens?: number | null
    cachedTokens?: number | null
    reasoningTokens?: number | null
    usageEstimated?: boolean | null
    inputCostPerToken?: number | null
    outputCostPerToken?: number | null
    inputCost?: number | null
    outputCost?: number | null
    totalCost?: number | null
    costEstimated?: boolean | null
    estimatedCostUsd?: number | null
    errorSummary?: string | null
    errorType?: string | null
    errorMessage?: string | null
    errorStatusCode?: number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: string | null
    endUser?: string | null
    usageAdjustments?: ModelProxyUsageAdjustmentUncheckedCreateNestedManyWithoutRequestInput
  }

  export type ModelProxyRequestCreateOrConnectWithoutMessagesInput = {
    where: ModelProxyRequestWhereUniqueInput
    create: XOR<ModelProxyRequestCreateWithoutMessagesInput, ModelProxyRequestUncheckedCreateWithoutMessagesInput>
  }

  export type ModelProxyRequestUpsertWithoutMessagesInput = {
    update: XOR<ModelProxyRequestUpdateWithoutMessagesInput, ModelProxyRequestUncheckedUpdateWithoutMessagesInput>
    create: XOR<ModelProxyRequestCreateWithoutMessagesInput, ModelProxyRequestUncheckedCreateWithoutMessagesInput>
    where?: ModelProxyRequestWhereInput
  }

  export type ModelProxyRequestUpdateToOneWithWhereWithoutMessagesInput = {
    where?: ModelProxyRequestWhereInput
    data: XOR<ModelProxyRequestUpdateWithoutMessagesInput, ModelProxyRequestUncheckedUpdateWithoutMessagesInput>
  }

  export type ModelProxyRequestUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    upstreamRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    model?: StringFieldUpdateOperationsInput | string
    upstreamModel?: StringFieldUpdateOperationsInput | string
    upstreamBaseUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    ttftMs?: NullableIntFieldUpdateOperationsInput | number | null
    inputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    outputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    totalTokens?: NullableIntFieldUpdateOperationsInput | number | null
    cachedTokens?: NullableIntFieldUpdateOperationsInput | number | null
    reasoningTokens?: NullableIntFieldUpdateOperationsInput | number | null
    usageEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    inputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    totalCost?: NullableFloatFieldUpdateOperationsInput | number | null
    costEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    estimatedCostUsd?: NullableFloatFieldUpdateOperationsInput | number | null
    errorSummary?: NullableStringFieldUpdateOperationsInput | string | null
    errorType?: NullableStringFieldUpdateOperationsInput | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorStatusCode?: NullableIntFieldUpdateOperationsInput | number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: NullableStringFieldUpdateOperationsInput | string | null
    endUser?: NullableStringFieldUpdateOperationsInput | string | null
    usageAdjustments?: ModelProxyUsageAdjustmentUpdateManyWithoutRequestNestedInput
  }

  export type ModelProxyRequestUncheckedUpdateWithoutMessagesInput = {
    id?: StringFieldUpdateOperationsInput | string
    upstreamRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    model?: StringFieldUpdateOperationsInput | string
    upstreamModel?: StringFieldUpdateOperationsInput | string
    upstreamBaseUrl?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    startedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    finishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    ttftMs?: NullableIntFieldUpdateOperationsInput | number | null
    inputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    outputTokens?: NullableIntFieldUpdateOperationsInput | number | null
    totalTokens?: NullableIntFieldUpdateOperationsInput | number | null
    cachedTokens?: NullableIntFieldUpdateOperationsInput | number | null
    reasoningTokens?: NullableIntFieldUpdateOperationsInput | number | null
    usageEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    inputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCostPerToken?: NullableFloatFieldUpdateOperationsInput | number | null
    inputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    outputCost?: NullableFloatFieldUpdateOperationsInput | number | null
    totalCost?: NullableFloatFieldUpdateOperationsInput | number | null
    costEstimated?: NullableBoolFieldUpdateOperationsInput | boolean | null
    estimatedCostUsd?: NullableFloatFieldUpdateOperationsInput | number | null
    errorSummary?: NullableStringFieldUpdateOperationsInput | string | null
    errorType?: NullableStringFieldUpdateOperationsInput | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorStatusCode?: NullableIntFieldUpdateOperationsInput | number | null
    errorDetails?: NullableJsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    responseHeaders?: NullableJsonNullValueInput | InputJsonValue
    apiKeyAlias?: NullableStringFieldUpdateOperationsInput | string | null
    endUser?: NullableStringFieldUpdateOperationsInput | string | null
    usageAdjustments?: ModelProxyUsageAdjustmentUncheckedUpdateManyWithoutRequestNestedInput
  }

  export type ModelProxyMessageCreateManyRequestInput = {
    id?: string
    role: string
    content: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type ModelProxyUsageAdjustmentCreateManyRequestInput = {
    id?: string
    reason: string
    promptTokensDelta?: number
    completionTokensDelta?: number
    totalCostDelta?: number
    note?: string | null
    createdAt?: Date | string
  }

  export type ModelProxyMessageUpdateWithoutRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyMessageUncheckedUpdateWithoutRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyMessageUncheckedUpdateManyWithoutRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    content?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyUsageAdjustmentUpdateWithoutRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    promptTokensDelta?: IntFieldUpdateOperationsInput | number
    completionTokensDelta?: IntFieldUpdateOperationsInput | number
    totalCostDelta?: FloatFieldUpdateOperationsInput | number
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyUsageAdjustmentUncheckedUpdateWithoutRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    promptTokensDelta?: IntFieldUpdateOperationsInput | number
    completionTokensDelta?: IntFieldUpdateOperationsInput | number
    totalCostDelta?: FloatFieldUpdateOperationsInput | number
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelProxyUsageAdjustmentUncheckedUpdateManyWithoutRequestInput = {
    id?: StringFieldUpdateOperationsInput | string
    reason?: StringFieldUpdateOperationsInput | string
    promptTokensDelta?: IntFieldUpdateOperationsInput | number
    completionTokensDelta?: IntFieldUpdateOperationsInput | number
    totalCostDelta?: FloatFieldUpdateOperationsInput | number
    note?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}