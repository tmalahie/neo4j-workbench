import { bootbox } from "bootbox-svelte";

export function showError(e) {
  if (e?.message) {
    bootbox.alert(e.message);
  }
  else {
    bootbox.alert("Unknown error");
  }
}