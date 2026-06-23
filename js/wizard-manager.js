/**
 * Livestock Manager - Generic Wizard Manager v1.1.0
 * Proporciona un framework para crear asistentes multi-paso de forma declarativa.
 * v1.1.0: Refactorizado a clases CSS para consistencia visual y soporte móvil.
 */

const WizardManager = {
    create(options) {
        const { id, title, steps, initialData, onComplete, onCancel } = options;

        let currentStepIndex = 0;
        let wizardData = { ...initialData };

        const overlay = document.createElement("div");
        overlay.id = id;
        overlay.className = "wizard-full-screen";

        const render = async () => {
            const step = steps[currentStepIndex];
            const isLastStep = currentStepIndex === steps.length - 1;

            let contentHtml = typeof step.content === 'function' ? await step.content(wizardData) : step.content;

            overlay.innerHTML = `
        <div class="wizard-header-fixed" style="border-top: 5px solid #d97706;">
          <h2 style="margin: 0 0 4px 0; color: #ffffff; font-size: 1.3rem; text-align: center; text-transform: uppercase; letter-spacing: 1px; font-weight: 900;">${title}</h2>
          <div style="text-align: center; color: #d97706; font-size: 0.75rem; font-weight: 700; letter-spacing: 2px;">PASO ${currentStepIndex + 1} DE ${steps.length}</div>
        </div>

        <div id="wizard-content-area" class="wizard-content-scrollable animate-in">
          ${contentHtml}
        </div>

        <div id="wizard-nav-area" class="wizard-footer-fixed">
          ${currentStepIndex > 0 ? '<button id="wizard-btn-prev" class="wizard-btn-action wizard-btn-secondary">⬅ Volver</button>' : '<div></div>'}
          <div style="display: flex; gap: 8px; flex: 1; justify-content: flex-end;">
            <button id="wizard-btn-cancel" class="wizard-btn-action wizard-btn-secondary">Cancelar</button>
            ${!isLastStep ? '<button id="wizard-btn-next" class="wizard-btn-action wizard-btn-primary">Siguiente ➔</button>' : ''}
            ${isLastStep ? '<button id="wizard-btn-finish" class="wizard-btn-action wizard-btn-success">Finalizar ✔</button>' : ''}
          </div>
        </div>
      `;

            const contentArea = overlay.querySelector('#wizard-content-area');

            // Attach events
            const prevBtn = overlay.querySelector('#wizard-btn-prev');
            const nextBtn = overlay.querySelector('#wizard-btn-next');
            const finishBtn = overlay.querySelector('#wizard-btn-finish');
            const cancelBtn = overlay.querySelector('#wizard-btn-cancel');

            if (prevBtn) {
                prevBtn.onclick = async () => {
                    await updateDataFromStep();
                    currentStepIndex--;
                    render();
                };
            }

            if (nextBtn) {
                nextBtn.onclick = async () => {
                    if (await updateDataFromStep() && await validateStep()) {
                        currentStepIndex++;
                        render();
                    }
                };
            }

            if (finishBtn) {
                finishBtn.onclick = async () => {
                    if (await updateDataFromStep() && await validateStep()) {
                        if (onComplete) await onComplete(wizardData);
                        overlay.remove();
                    }
                };
            }

            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    if (onCancel) onCancel();
                    overlay.remove();
                };
            }

            if (step.onRender) {
                step.onRender(wizardData, contentArea);
            }
        };

        const updateDataFromStep = async () => {
            const step = steps[currentStepIndex];
            if (step.onChange) {
                try {
                    await step.onChange(wizardData);
                } catch (e) {
                    App.toastError(e.message);
                    return false;
                }
            }
            return true;
        };

        const validateStep = async () => {
            const step = steps[currentStepIndex];
            if (step.validate) {
                try {
                    const isValid = await step.validate(wizardData);
                    if (!isValid) {
                        return false;
                    }
                } catch (e) {
                    App.toastError(e.message);
                    return false;
                }
            }
            return true;
        };

        document.body.appendChild(overlay);
        render();
    }
};

window.WizardManager = WizardManager;
