// ==UserScript==
// @name         Stash Save Button Position Fix
// @namespace    http://kennyg.com/
// @version      1.3
// @description  Uses flexbox so per-scene Save buttons in the Stash tagger/batch save UI sit at the bottom-right of the right-hand column.
// @author       KennyG
// @match        https://stash.shannabower.com/scenes*
// @match        https://stash.shannabower.com/groups*
// @grant        none
// @run-at       document-end
// @icon        https://raw.githubusercontent.com/stashapp/stash/develop/ui/v2.5/public/favicon.png
// ==/UserScript==

(function () {
    'use strict';

    const DEBUG = false; // flip to true for console noise
    const SAVE_BUTTON_SELECTOR = 'button.btn.btn-primary';

    function isTaggerContext() {
        // Only run when the tagger/batch-save UI is present to avoid interfering with normal scene pages
        return !!document.querySelector('.tagger-container');
    }

    function tweakLayoutForSaveButton(saveButton) {
        if (!saveButton) return;

        // Only touch real "Save" buttons, not other primary buttons.
        const label = saveButton.textContent && saveButton.textContent.trim();
        if (label !== 'Save') return;

        // Parent column: col-lg-6 / col-md-6 on the right-hand side.
        const rightCol = saveButton.closest('.col-lg-6, .col-md-6');
        if (rightCol) {
            rightCol.classList.add('d-flex', 'flex-column');
        }

        // Wrapper around the button: make it a flex row pinned to the bottom,
        // full width, with content aligned to the right.
        const wrapper = saveButton.parentElement;
        if (wrapper instanceof HTMLElement) {
            wrapper.classList.add('mt-auto', 'w-100', 'd-flex', 'justify-content-end');
        }

        if (DEBUG) {
            console.log('[stash-SaveButton] tweaked layout for Save button', {
                saveButton,
                rightCol,
                wrapper,
            });
        }
    }

    function fixSaveButtonsInContainer(root) {
        if (!isTaggerContext()) return;

        const scope = root || document;
        const buttons = scope.querySelectorAll(SAVE_BUTTON_SELECTOR);
        if (DEBUG && !buttons.length) {
            console.warn('[stash-SaveButton] No primary buttons found in scope', scope);
        }

        buttons.forEach(btn => {
            tweakLayoutForSaveButton(btn);
        });
    }

    function setupObserver() {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (!(node instanceof HTMLElement)) return;

                        // Case 1: Save buttons added later into existing rows (e.g. after search completes)
                        const newlyAddedSaveButtons = [];
                        if (node.matches && node.matches(SAVE_BUTTON_SELECTOR)) {
                            newlyAddedSaveButtons.push(node);
                        }
                        node.querySelectorAll && node.querySelectorAll(SAVE_BUTTON_SELECTOR).forEach(btn => {
                            newlyAddedSaveButtons.push(btn);
                        });

                        if (newlyAddedSaveButtons.length) {
                            if (DEBUG) console.log('[stash-SaveButton] MutationObserver: new Save buttons detected', newlyAddedSaveButtons);
                            newlyAddedSaveButtons.forEach(btn => tweakLayoutForSaveButton(btn));
                        }
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        fixSaveButtonsInContainer(document);
        setupObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


