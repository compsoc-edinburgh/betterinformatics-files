import * as React from "react";
import AutocompleteInput from "./autocompleteinput";
import { fetchpost } from '../fetchutils'

interface Props {
  exam: string;
  category: string;
  savedCategory: string;
  categories: string[];
  onChange: (exam: string, value: string) => void;
  onSave: (exam: string, value: string) => void;
}

async function submitSave (exam: string, oldCategory: string, newCategory: string, onSave: (exam: string, value: string) => void) {
  await fetchpost(`/api/category/${oldCategory}/remove`, {exam: exam});
  await fetchpost(`/api/category/${newCategory}/add`, {exam: exam});
  onSave(exam, newCategory);
}

export default ({ exam, category, savedCategory, categories, onChange, onSave }: Props) => (
  <p>{exam} <AutocompleteInput name={exam} value={category} placeholder="category..." autocomplete={categories} onChange={(ev) => onChange(exam, ev.target.value)} /> <button onClick={(ev) => submitSave(exam, savedCategory, category, onSave)} disabled={savedCategory === category}>Save</button></p>
)
