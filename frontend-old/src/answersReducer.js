import immutable from "immutable";
import $ from "jquery";

function typeOf (obj) {
  return {}.toString.call(obj).split(' ')[1].slice(0, -1).toLowerCase();
}
export default function reducer(state={},action){
  const stateLocal = immutable.fromJS(state);
  switch (action.type) {
    case "REQUESTED_ANSWERS":
      return stateLocal.toJS();
    case "REQEUSTED_NEW_ANSWERSECTION":
      return stateLocal.toJS();
    case "RECIEVED_ANSWERS":
      return stateLocal.updateIn([action.pageNum+"",action.relHeight+""],()=>immutable.fromJS(action.value["answersection"]).set("oid",action.value["oid"])).toJS();
    case "TOGGLE_LIKE":
      if ($.inArray(action.userId,state[action.pageNum+""][action.relHeight+""].answers[action.answerIndex].upvotes)>-1){
        return stateLocal.updateIn([action.pageNum+"",action.relHeight+"","answers",action.answerIndex+"","upvotes"],(arr)=>{return arr.filter(e => e !== action.userId);}).toJS();
      }else{
        return stateLocal.updateIn([action.pageNum+"",action.relHeight+"","answers",action.answerIndex+"","upvotes"],(arr)=>arr.push(action.userId)).toJS();
      }
    case "ADD_COMMENT":
      return stateLocal.updateIn([action.pageNum+"",action.relHeight+"","answers",action.answerIndex+"","comments"],(comments)=>comments.push({text:action.value,authorId:"me",time:1488893300})).toJS();
    case "DELETE_COMMENT":
      return stateLocal.updateIn([action.pageNum+"",action.relHeight+"","answers",action.answerIndex,"comments"],(comments)=>comments.delete(action.commentIndex)).toJS();
    case "NEW_ANSWER":
      return stateLocal.updateIn([action.pageNum+"",action.relHeight+"","answers"],(answers)=>answers.push({"text":"","authorId":"me","time":1488893168,"upvotes":[],"edit":true,"comments":[]})).toJS();
    case "REMOVE_ANSWERSECTION":
      return stateLocal.updateIn([action.pageNum+"",action.relHeight+"","removed"],()=>true).toJS();
    case "EDITED_ANSWER":
      const change = stateLocal.updateIn([action.pageNum+"",action.relHeight+"","answers",action.answerIndex+"","text"],(text)=>action.value);
      return change.updateIn([action.pageNum+"",action.relHeight+"","answers",action.answerIndex+"","edit"],()=>false).toJS();
    case "START_EDIT":
      return stateLocal.updateIn([action.pageNum+"",action.relHeight+"","answers",action.answerIndex+"","edit"],()=>true).toJS();
    case "CANCEL_EDIT":
      return stateLocal.updateIn([action.pageNum+"",action.relHeight+"","answers",action.answerIndex+"","edit"],()=>false).toJS();
    default:
      return state;

  }
}
