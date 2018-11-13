import * as React from "react";
import AutocompleteInput from "./autocomplete-input";
import {fetchpost} from '../fetch-utils';
import {Link} from "react-router-dom";

interface Props {
  exam: string;
  category: string;
  savedCategory: string;
  categories: string[];
  onChange: (exam: string, value: string) => void;
  onSave: (exam: string, value: string) => void;
}

async function submitSave(exam: string, oldCategory: string, newCategory: string, onSave: (exam: string, value: string) => void) {
  await fetchpost(`/api/category/remove`, {category: oldCategory, exam: exam});
  await fetchpost(`/api/category/add`, {category: newCategory, exam: exam});
  onSave(exam, newCategory);
}

export default ({exam, category, savedCategory, categories, onChange, onSave}: Props) => (
  <p><Link to={"/exams/" + exam}>{exam}</Link> <AutocompleteInput name={exam} value={category} placeholder="category..."
                                               autocomplete={categories}
                                               onChange={(ev) => onChange(exam, ev.target.value)}/>
    <button onClick={(ev) => submitSave(exam, savedCategory, category, onSave)}
            disabled={savedCategory === category}>Save
    </button>
  </p>
)
