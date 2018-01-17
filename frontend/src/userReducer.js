export default function reducer(state={id:null,name:null},action){
  switch (action.type) {
    case "FETCH_USER":
      return action.value;
    default:
      return state;
  }
}
