var urlPrefix = window.__urlPrefix__;


export function fetchUser(){

    return {type:"FETCH_USER",value:{id:window.__userId__,name:window.__userDisplayName__}};
}
