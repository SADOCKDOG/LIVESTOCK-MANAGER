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
        <div class="wizard-header-fixed">
          <h2>${title}</h2>
          <div class="wizard-step-indicator">PASO ${currentStepIndex + 1} DE ${steps.length}</div>
        </div>

        <div id="wizard-content-area" class="wizard-content-scrollable animate-in">
          ${contentHtml}
        </div>

        <div id="wizard-nav-area" class="wizard-footer-fixed">
          ${currentStepIndex > 0 ? `<button id="wizard-btn-prev" class="wizard-btn-action wizard-btn-secondary">${Icons.atras()} Volver</button>` : '<div></div>'}
          <div class="wizard-footer-buttons">
            <button id="wizard-btn-cancel" class="wizard-btn-action wizard-btn-secondary">Cancelar</button>
            ${!isLastStep ? `<button id="wizard-btn-next" class="wizard-btn-action wizard-btn-primary">Siguiente ${Icons.siguiente()}</button>` : ''}
            ${isLastStep ? `<button id="wizard-btn-finish" class="wizard-btn-action wizard-btn-success">Finalizar ${Icons.check()}</button>` : ''}
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
                cancelBtn.onclick = async () => {
                    // Con pasos avanzados hay datos introducidos: confirmar el descarte
                    if (currentStepIndex > 0) {
                        const ok = await Confirm.confirm('Cancelar asistente', 'Se perderán los datos introducidos. ¿Deseas salir?', true, 'Salir', 'Continuar aquí');
                        if (!ok) return;
                    }
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
