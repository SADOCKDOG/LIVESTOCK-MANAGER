const ModalManager = {
    _activeModals: [],

    /**
     * Muestra un modal en pantalla de forma segura.
     * @param {string} id - Identificador único del modal.
     * @param {string|HTMLElement} content - Contenido HTML o elemento DOM.
     * @param {Object} options - Opciones adicionales (width, closeOnOverlayClick).
     * @returns {HTMLElement} El contenedor (overlay) del modal.
     */
    show: function (id, content, options = {}) {
        this.close(id); // Prevenir duplicados

        const overlay = document.createElement('div');
        overlay.id = id;
        const zIndex = 10000 + (this._activeModals.length * 10);
        overlay.style = `position:fixed; inset:0; background:#000; display:flex; align-items:center; justify-content:center; z-index:${zIndex}; padding:0; overflow-y:auto;`;

        if (options.closeOnOverlayClick) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(id);
                }
            });
        }

        if (typeof content === 'string') {
            overlay.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            overlay.appendChild(content);
        }

        document.body.appendChild(overlay);
        this._activeModals.push({ id, element: overlay });
        this._setupKeyListener();

        return overlay;
    },

    /**
     * Cierra y destruye un modal específico.
     * @param {string} id - Identificador del modal a cerrar.
     */
    close: function (id) {
        const index = this._activeModals.findIndex(m => m.id === id);
        if (index > -1) {
            const modal = this._activeModals[index];
            if (modal.element && modal.element.parentNode) {
                modal.element.parentNode.removeChild(modal.element);
            }
            this._activeModals.splice(index, 1);
            this._setupKeyListener();
        } else {
            // Fallback por si acaso existe en el DOM pero no en el registro
            const el = document.getElementById(id);
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }
    },

    /**
     * Cierra todos los modales activos.
     */
    closeAll: function () {
        while (this._activeModals.length > 0) {
            this.close(this._activeModals[this._activeModals.length - 1].id);
        }
    },

    _setupKeyListener: function () {
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
        }

        if (this._activeModals.length > 0) {
            this._keyHandler = (e) => {
                if (e.key === 'Escape') {
                    const topModal = this._activeModals[this._activeModals.length - 1];
                    this.close(topModal.id);
                }
            };
            document.addEventListener('keydown', this._keyHandler);
        }
    }
};

window.ModalManager = ModalManager;