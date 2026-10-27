// Arrow keys move the focus between the buttons of a board grid (cards, tiles, pads), skipping disabled
// ones; Enter / Space then press the focused button as usual. Use as the grid's onKeyDown.
export function moveGridFocus(event, columns) {
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[event.key];
  if (!step || event.altKey || event.ctrlKey || event.metaKey) return;
  const buttons = [...event.currentTarget.querySelectorAll('button')];
  let index = buttons.indexOf(event.target);
  if (index === -1) return;
  event.preventDefault();
  for (index += step; index >= 0 && index < buttons.length; index += step) {
    if (!buttons[index].disabled) {
      buttons[index].focus();
      return;
    }
  }
}
