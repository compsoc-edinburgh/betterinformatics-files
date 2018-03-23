import { combineReducers } from "redux"

import answers from "./answersReducer"
import user from "./userReducer"

export default combineReducers({
  answers,
  user,
})
