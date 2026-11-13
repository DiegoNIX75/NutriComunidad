const FEEDBACK_DURATION_MS = 4000;
const FEEDBACK_MODIFIERS = ['commerce-feedback--success', 'commerce-feedback--warning'];

export function createFeedback(element) {
  let hideTimer;

  return {
    show(message, type) {
      clearTimeout(hideTimer);
      element.classList.remove(...FEEDBACK_MODIFIERS);
      element.classList.add(`commerce-feedback--${type}`);
      element.textContent = message;
      element.hidden = false;
      hideTimer = setTimeout(() => {
        element.hidden = true;
      }, FEEDBACK_DURATION_MS);
    },
  };
}
