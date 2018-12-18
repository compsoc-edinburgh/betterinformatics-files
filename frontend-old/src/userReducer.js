export default function reducer(state={id:null,name:null},action){
  switch (action.type) {
    case "REQUESTED_USER":
      return state;
    case "RECIEVED_USER":
      return action.value;
    default:
      return state;
  }
}
