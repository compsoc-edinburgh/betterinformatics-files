var urlPrefix = window.__urlPrefix__;

function requestedUser(){
    return {type:"REQUESTED_USER",value:{}};
}
function recievedUser(username, userDisplayName){
    return {type:"RECIEVED_USER",value:{id:username,name:userDisplayName}};
}

export function fetchUser(){
    return (dispatch,getStore) =>
    {
        const store = getStore();
        if(!store.user.id){
            dispatch(requestedUser());
            fetch(window.__urlPrefix__+"/api/user", {credentials: "same-origin"})
                .then(response => response.json())
                .then(json => dispatch(recievedUser(json.username,json.displayname)));
        }
    };
}
