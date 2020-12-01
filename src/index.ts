import 'reflect-metadata';
import express, { Request, Response } from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import 'colors';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { createConnection } from "typeorm";
import { AuthResolver } from './resolvers/auth';
import { UserEntity } from './entities/User';
import { ChannelEntity } from './entities/Channel';
import { errorHandler } from './middlewares/errorHandler';
import { isProd } from './utils/constants';
import { MyContext } from './utils/types';

const main = async () =>
{
    dotenv.config( { path: 'config.env' } );

    const RedisClient = new Redis();
    const RedisStore = connectRedis( session );

    await createConnection( {
        type: 'postgres',
        database: 'slack',
        username: process.env.POSTGRES_USERNAME,
        password: process.env.POSTGRES_PASSWORD,
        logging: true,
        synchronize: true,  // make new relation if it does not exists
        entities: [ UserEntity, ChannelEntity ]
    } );

    // await UserEntity.delete( {} );

    console.log( `Postgres is here`.blue.bold );

    const app = express();

    app.use( cors( {
        origin: process.env.CLIENT_URL,
        optionsSuccessStatus: 200
    } ) );

    app.get( '/', ( _: Request, res: Response ) =>
    {
        res.send( 'API up and runnin' );
        res.end();
    } );

    app.use( session( {
        store: new RedisStore( { client: RedisClient } ),
        name: 'quid',
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProd(),
            maxAge: 1000 * 60 * 60
        }
    } ) );

    const apolloServer = new ApolloServer( {
        schema: await buildSchema( {
            resolvers: [ HelloResolver, AuthResolver ],
            validate: false
        } ),
        context: ( { req, res } ): MyContext => ( { req, res, session: req.session } )
    } );

    apolloServer.applyMiddleware( { app, cors: false } );

    app.use( errorHandler );

    const PORT = process.env.PORT || 5000;
    app.listen( PORT, () =>
    {
        console.log( `Server started on port ${ PORT }`.green.bold );
    } );
};

main();