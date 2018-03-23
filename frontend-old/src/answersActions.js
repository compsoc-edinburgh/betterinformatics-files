import $ from "jquery";
import _ from "lodash";

function requestedAnswers(pageNum,relHeight){
  return{type:"REQUESTED_ANSWERS",pageNum,relHeight}
}
function recievedAnswers(pageNum,relHeight,answers){
  return {type:"RECIEVED_ANSWERS",pageNum,relHeight,value:answers}
}

export function fetchAnswers(pageNum,relHeight,oid){
  return (dispatch,getState) =>{
    dispatch(requestedAnswers(pageNum,relHeight));
    fetch(window.__urlPrefix__+"/api/"+window.__filename__+"/answersection?oid="+oid, {credentials: "same-origin"})
    .then(response => response.json())
    .then(json => dispatch(recievedAnswers(pageNum,relHeight,json)));
  }
  /*
  return{type:"FETCH_ANSWERS",value:{"answers":
    [
      {authorId:"fo2r3b8g23g823g",text:"### This is a $t=e5^T$ answer!",comments:[],upvotes:new Set(["fo2r3b8g23g823g"]),"time":1488893168}
    ],"asker":"fo2r3b8g23g823g"},pageNum:pageNum,relHeight:relHeight};
    */
}

export function addAnswersection(pageNum,relHeight){ //Also has online part will at first give empty answer and then update with what is online
  return dispatch => {
    dispatch(requestedNewAnswersection(pageNum,relHeight))
    fetch(window.__urlPrefix__+"/api/"+window.__filename__+"/newanswersection?pageNum="+pageNum+"&relHeight="+relHeight, {credentials: "same-origin"})
    .then(response => response.json())
    .then(json =>dispatch(recievedAnswers(pageNum,relHeight,json)))
  }
}
function requestedNewAnswersection(pageNum,relHeight){
  return {type:"REQEUSTED_NEW_ANSWERSECTION",pageNum,relHeight};
}
export function wantRemoveAnswersection(pageNum,relHeight){
  return (dispatch,getState) =>{
    var state = getState();
    var answerSectionId = state.answers[pageNum+""][relHeight+""]["oid"];
    fetch(window.__urlPrefix__+"/api/"+window.__filename__+"/removeanswersection?oid="+answerSectionId, {credentials: "same-origin"})
    .then(response => response.json())
    .then(response => response.status==="success"?dispatch(removeAnswersection(pageNum,relHeight)):undefined);
  }
}
function removeAnswersection(pageNum,relHeight){
  return {type:"REMOVE_ANSWERSECTION",pageNum:pageNum,relHeight:relHeight,deleted:true};
}
export function wantDeleteComment(pageNum,relHeight,answerIndex,commentIndex){
  return (dispatch,getState) =>{
    var state = getState();
    var answer = state.answers[pageNum+""][relHeight+""]["answers"][answerIndex+""];
    var answersectionId = state.answers[pageNum+""][relHeight+""]["oid"];
    var comment = answer["comments"][commentIndex];
    if (_.has(comment,'oid')){
      console.log(comment.oid);
      fetch(window.__urlPrefix__+"/api/"+window.__filename__+"/removecomment?answersectionoid="+answersectionId+"&oid="+comment.oid, {credentials: "same-origin"})
      .then(response => response.json())
      .then(json => dispatch(recievedAnswers(pageNum,relHeight,json)))
    }else{
      console.log("comment doesnt have ID")
    }
  }
}


function addComment(pageNum,relHeight,answerIndex,value){
  return {type:"ADD_COMMENT",pageNum:pageNum,relHeight:relHeight,answerIndex:answerIndex,value:value};
}
export function wantAddComment(pageNum,relHeight,answerIndex,text){
  return (dispatch,getState) =>{
    var state = getState();
    var answer = state.answers[pageNum+""][relHeight+""]["answers"][answerIndex+""];
    var answerSectionId = state.answers[pageNum+""][relHeight+""]["oid"];
    var oid = answer["oid"];
    var content = {};
    content["text"] = text;
    fetch(window.__urlPrefix__+"/api/"+window.__filename__+"/addcomment?answersectionoid="+answerSectionId+"&answerOid="+oid,
    {headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    "credentials": "same-origin",
    method: "POST",
    body: JSON.stringify(content)}
    )
    .then(response => response.json())
    .then(json => dispatch(recievedAnswers(pageNum,relHeight,json)))
  }
}
export function wantToggleLike(pageNum,relHeight,answerIndex,userId){
  return (dispatch,getState) =>{
    var state = getState();
    var answer = state.answers[pageNum+""][relHeight+""]["answers"][answerIndex+""];
    var answerSectionId = state.answers[pageNum+""][relHeight+""]["oid"];
    var likes = $.inArray(userId,state.answers[pageNum+""][relHeight+""].answers[answerIndex].upvotes)>-1
    if (_.has(answer,'oid')){
      fetch(window.__urlPrefix__+"/api/"+window.__filename__+"/togglelike?answersectionoid="+answerSectionId+"&oid="+answer.oid, {credentials: "same-origin"})
      .then(response => response.json())
      .then(json => dispatch(recievedAnswers(pageNum,relHeight,json)))
    }
  }
}
function toggleLike(pageNum,relHeight,answerIndex,userId){
  return {type:"TOGGLE_LIKE",userId:userId,pageNum:pageNum,relHeight:relHeight,answerIndex:answerIndex};
}
export function newAnswer(pageNum,relHeight){
  return {type:"NEW_ANSWER",pageNum:pageNum,relHeight:relHeight};
}
export function wantToSetAnswer(pageNum,relHeight,answerIndex,text){
  return (dispatch,getState) =>{
    var state = getState();
    var answer = state.answers[pageNum+""][relHeight+""]["answers"][answerIndex+""];
    var answerSectionId = state.answers[pageNum+""][relHeight+""]["oid"];
    answer["text"] = text;
    fetch(window.__urlPrefix__+"/api/"+window.__filename__+"/setanswer?answersectionoid="+answerSectionId,
    {headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: "same-origin",
    method: "POST",
    body: JSON.stringify(answer)}
    )
    .then(response => response.json())
    .then(json => dispatch(recievedAnswers(pageNum,relHeight,json)))
  }
}
function edited(pageNum,relHeight,answerIndex,text){
  return {type:"EDITED_ANSWER",pageNum:pageNum,relHeight:relHeight,answerIndex:answerIndex,value:text};
}
export function startEdit(pageNum,relHeight,answerIndex){
  return {type:"START_EDIT",pageNum:pageNum,relHeight:relHeight,answerIndex:answerIndex}
}
export function cancelEdit(pageNum,relHeight,answerIndex){
  return {type:"CANCEL_EDIT",pageNum:pageNum,relHeight:relHeight,answerIndex:answerIndex}
}
