import { createStyles, makeStyles, Theme, Typography } from "@material-ui/core";
import { Alert } from '@material-ui/lab';
import { Container } from "next/app";
import { FC, Fragment } from "react";
import { MessageEntity, UserEntity } from "../src/generated/graphql";

const useStyles = makeStyles( ( theme: Theme ) => createStyles( {
    root: {
        width: '50rem',
        height: '200%',
        background: '#333'
    }
} ) );

interface ICChatBox
{
    messages: ( { __typename?: "MessageEntity"; } & Pick<MessageEntity, "content"> & { poster: { __typename?: "UserEntity"; } & Pick<UserEntity, "username">; } )[];
}

const CChatBox: FC<ICChatBox> = ( { messages } ) =>
{
    const classes = useStyles();
    console.log( 'messages = ', messages );
    return (
        <div className={ classes.root }>
            <Container>
                { messages.length > 1 ? <Container>
                    { messages.map( ( message, index ) => <Alert key={ index } variant='outlined' severity='info'>
                        { message.content }
                    </Alert> ) }
                </Container> : <Typography variant='h6' color='secondary'>
                        No messages yet.</Typography> }
            </Container>
        </div>
    );
};

export default CChatBox;
