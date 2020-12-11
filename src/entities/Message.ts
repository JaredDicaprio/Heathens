import { Field, ObjectType } from "type-graphql";
import { Entity, Column, CreateDateColumn, BaseEntity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { ChannelEntity } from "./Channel";
import { UserEntity } from "./User";

@ObjectType()
@Entity()
export class MessageEntity extends BaseEntity
{
    @Field( () => Number )
    @PrimaryGeneratedColumn()
    id!: number;

    @Field( () => String )
    @Column()
    content!: string;

    @Column( () => String )
    @Field( { defaultValue: 'text' } )
    type!: string;

    @ManyToOne( () => UserEntity, user => user.messages )
    @Field( () => UserEntity )
    poster: UserEntity;

    @ManyToOne( () => ChannelEntity, channel => channel.messages )
    @Field( () => ChannelEntity )
    channel: ChannelEntity;

    @Field( () => String )
    @CreateDateColumn()
    createdAt: Date;
}