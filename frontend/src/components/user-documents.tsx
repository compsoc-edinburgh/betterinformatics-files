import React, { useState } from "react";
import { Card, LikeFilledIcon, CardBody, CardTitle, LikeIcon, Spinner, Alert } from "@vseth/components";
import { useDocumentsLikedBy, useDocumentsUsername } from "../api/hooks";
import { Link } from "react-router-dom";
import Grid from "../components/grid";
import { useUser } from "../auth";
import ContentContainer from "./secondary-container";
import { Document, UserInfo } from "../interfaces";

interface UserDocumentsProps {
    username: string;
    userinfo?: UserInfo;
}
const UserDocuments: React.FC<UserDocumentsProps> = ({ username, userinfo }) => {
    const user = useUser()!;
    const isMyself = user.username === username;
    const [documentsError, loading, documents] = useDocumentsUsername(username);
    const [likedError, likedLoading, likedDocuments] = useDocumentsLikedBy(username, isMyself);
    const displayDocuments = (documents: Document[]) => {
        return (
            <Grid>
                {documents && documents.map(document => <Card key={document.slug}>
                    <CardBody>
                        <Link to={`/user/${document.author}/document/${document.slug}`}>
                            <CardTitle tag="h6">{document.display_name}</CardTitle>
                        </Link>
                        <div>
                            <Link to={`/user/${document.author}`} className="text-muted">
                                @{document.author}
                            </Link>
                            {document.liked ? <span className="text-danger ml-2">
                                <LikeFilledIcon className="mr-1" /> {document.like_count}
                            </span> : <span className="text-muted ml-2">
                                <LikeIcon className="mr-1" /> {document.like_count}
                            </span>}
                        </div>
                    </CardBody>
                </Card>)}
            </Grid>
        )
    };
    return (
        <>
            <h3>{(isMyself) ? "Your" : `${userinfo?.displayName ?? `@${username}`}'s`} Documents</h3>
            {documentsError && <Alert color="danger">{documentsError.toString()}</Alert>}
            {documents && displayDocuments(documents)}
            {(!documents || documents.length === 0) && <Alert color="secondary">No documents</Alert>}
            {loading && <Spinner />}

            {isMyself && (<ContentContainer className="my-3">
                <h3>Liked Documents</h3>
                {likedError && <Alert color="danger">{likedError.toString()}</Alert>}
                {likedDocuments && displayDocuments(likedDocuments)}
                {(!likedDocuments || likedDocuments.length === 0) && <Alert color="secondary">No liked documents</Alert>}
                {likedLoading && <Spinner />}
            </ContentContainer>)}
        </>
    );
}

export default UserDocuments;
