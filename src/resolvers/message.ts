import { MessageEntity } from "../entities/Message";
import { Arg, Ctx, FieldResolver, Mutation, Resolver, Root, UseMiddleware } from "type-graphql";
import { isAuthenticated } from "../middlewares/protect";
import { ErrorResponse } from "../utils/ErrorResponse";
import { MyContext } from "../utils/types";
import { ChannelEntity } from "../entities/Channel";
import { UserEntity } from "../entities/User";
import { getConnection } from "typeorm";

@Resolver( MessageEntity )
export class MessageResolver
{
    @FieldResolver( () => ChannelEntity )
    channel (
        @Root()
        message: MessageEntity,
        @Ctx()
        { channelLoader }: MyContext,
    ): Promise<ChannelEntity>
    {
        return channelLoader.load( message.channelId );
    }

    @FieldResolver( () => UserEntity )
    poster (
        @Root()
        message: MessageEntity,
        @Ctx()
        { usersLoader }: MyContext,
    ): Promise<UserEntity>
    {
        return usersLoader.load( message.posterId );
    }


    @UseMiddleware( isAuthenticated )
    @Mutation( () => MessageEntity )
    async postMessage (
        @Arg( 'content' )
        content: string,
        @Arg( 'channelId' )
        channelId: number,
        @Ctx()
        { session, }: MyContext
    ): Promise<MessageEntity>
    {
        const newMessage = await MessageEntity.create( { content, posterId: session.user as number, channelId } ).save();
        await getConnection().query( ( `
                UPDATE channel_entity
                SET "messageIds" = "messageIds" || ${ newMessage.id }
                WHERE id = ${ channelId }
            `) );
        return newMessage;
    }

    @UseMiddleware( isAuthenticated )
    @Mutation( () => Boolean )
    async deleteMessage (
        @Arg( 'id' )
        id: number,
        @Ctx()
        { session }: MyContext
    ): Promise<boolean>
    {
        const message = await MessageEntity.findOne( id );

        if ( !message )
        {
            throw new ErrorResponse( 'Resource does not exits', 404 );
        }

        if ( message.posterId !== session.user )
        {
            throw new ErrorResponse( 'Not Authorized', 400 );
        }

        await getConnection().query( ( `
                UPDATE channel_entity
                SET "messageIds" = array_remove("messageIds", ${ message.id })
                WHERE id = ${ message.channelId }
            `) );

        MessageEntity.delete( { id } );
        return true;
    }
}