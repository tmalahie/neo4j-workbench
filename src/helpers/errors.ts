import { bootbox } from "bootbox-svelte";

export function showError(e) {
  if (e?.message) {
    return bootbox.alert(e.message);
  }
  else {
    return bootbox.alert("Unknown error");
  }
}