/**
 * Error Handler Utility - Livestock Manager
 * Proporciona manejo estandarizado de errores en toda la aplicación
 */

const ErrorHandler = {
  // Tipos de errores
  ERROR_TYPES: {
    VALIDATION: "VALIDATION_ERROR",
    DATABASE: "DATABASE_ERROR",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    CONSTRAINT: "CONSTRAINT_ERROR",
    UNKNOWN: "UNKNOWN_ERROR",
  },

  /**
   * Clase de error personalizado
   */
  AppError: class AppError extends Error {
    constructor(message, type = "UNKNOWN_ERROR", details = {}) {
      super(message);
      this.name = "AppError";
      this.type = type;
      this.details = details;
      this.timestamp = new Date().toISOString();
    }

    toJSON() {
      return {
        name: this.name,
        message: this.message,
        type: this.type,
        details: this.details,
        timestamp: this.timestamp,
      };
    }
  },

  /**
   * Valida que una finca esté activa
   * @throws AppError si no hay finca activa
   */
  async validateActiveFinca() {
    const fincaId = await Fincas.getActiveId();
    if (!fincaId) {
      throw new this.AppError(
        "No hay finca activa seleccionada",
        this.ERROR_TYPES.UNAUTHORIZED,
        { action: "validateActiveFinca", required: "activeFincaId" }
      );
    }
    return fincaId;
  },

  /**
   * Valida que un objeto exista en BD
   * @throws AppError si no existe
   */
  async validateEntityExists(entityName, id, getFunction) {
    if (!id) {
      throw new this.AppError(
        `${entityName} ID es requerido`,
        this.ERROR_TYPES.VALIDATION,
        { entity: entityName, field: "id" }
      );
    }

    const entity = await getFunction(id);
    if (!entity) {
      throw new this.AppError(
        `${entityName} con ID ${id} no encontrado`,
        this.ERROR_TYPES.NOT_FOUND,
        { entity: entityName, id }
      );
    }
    return entity;
  },

  /**
   * Maneja errores de dependencias FK
   */
  handleConstraintError(error, context = {}) {
    let message = error.message || "Error de restricción de base de datos";
    let type = this.ERROR_TYPES.CONSTRAINT;

    // Detectar patrones comunes de violación de restricciones
    if (message.includes("rebaño") || message.includes("rebanos")) {
      message = `No se puede eliminar porque existen rebaños asociados`;
    } else if (message.includes("animal") || message.includes("animales")) {
      message = `No se puede eliminar porque existen animales asociados`;
    } else if (message.includes("producción")) {
      message = `No se puede eliminar porque existen registros de producción asociados`;
    } else if (
      message.includes("único") ||
      message.includes("unique") ||
      message.includes("duplicate")
    ) {
      type = this.ERROR_TYPES.CONSTRAINT;
      message = `Registro duplicado: ${context.field || "un campo"} ya existe`;
    }

    return new this.AppError(message, type, {
      originalError: error.message,
      context,
    });
  },

  /**
   * Maneja errores de validación de entrada
   */
  validateRequired(field, value, customMessage = null) {
    if (value === undefined || value === null || value === "") {
      const message = customMessage || `Campo requerido: ${field}`;
      throw new this.AppError(message, this.ERROR_TYPES.VALIDATION, {
        field,
        value,
        required: true,
      });
    }
    return value;
  },

  /**
   * Valida formato de email
   */
  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      throw new this.AppError(
        `Email inválido: ${email}`,
        this.ERROR_TYPES.VALIDATION,
        { field: "email", format: "invalid" }
      );
    }
    return email;
  },

  /**
   * Valida patrón de caravana (Flexibilizado para permitir diferentes formatos)
   */
  validateCaravana(numero_identificacion) {
    // Normativa española SITRAN: código de país (2 letras) + 12 dígitos
    // Ejemplo válido: ES123456789012
    const CROTAL_REGEX = /^[A-Z]{2}\d{12}$/;
    const valorLimpio = numero_identificacion.toString().trim().toUpperCase();

    if (!CROTAL_REGEX.test(valorLimpio)) {
      throw new this.AppError(
        "El número de identificación (crotal) debe seguir la normativa: 2 letras de código de país seguidas de 12 dígitos (ej. ES123456789012)",
        this.ERROR_TYPES.VALIDATION,
        {
          field: "numero_identificacion",
          format: "XX000000000000 (2 letras + 12 dígitos)",
          value: valorLimpio,
        }
      );
    }
    return valorLimpio;
  },

  /**
   * Comprueba si una cadena tiene formato de crotal válido (2 letras + 12 dígitos).
   * No lanza excepción — útil para validaciones de snapshot.
   */
  isCrotalValido(valor) {
    if (!valor) return false;
    return /^[A-Z]{2}\d{12}$/.test(valor.toString().trim().toUpperCase());
  },

  /**
   * Valida número numérico
   */
  validateNumeric(value, fieldName, minValue = null, maxValue = null) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new this.AppError(
        `${fieldName} debe ser un número`,
        this.ERROR_TYPES.VALIDATION,
        { field: fieldName, type: "numeric" }
      );
    }

    if (minValue !== null && num < minValue) {
      throw new this.AppError(
        `${fieldName} debe ser mayor o igual a ${minValue}`,
        this.ERROR_TYPES.VALIDATION,
        { field: fieldName, minValue, actual: num }
      );
    }

    if (maxValue !== null && num > maxValue) {
      throw new this.AppError(
        `${fieldName} debe ser menor o igual a ${maxValue}`,
        this.ERROR_TYPES.VALIDATION,
        { field: fieldName, maxValue, actual: num }
      );
    }

    return num;
  },

  /**
   * Valida fecha ISO
   */
  validateDate(dateString, fieldName = "fecha") {
    if (!dateString) {
      throw new this.AppError(
        `${fieldName} es requerida`,
        this.ERROR_TYPES.VALIDATION,
        { field: fieldName }
      );
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new this.AppError(
        `${fieldName} tiene formato inválido (debe ser ISO 8601)`,
        this.ERROR_TYPES.VALIDATION,
        { field: fieldName, format: "ISO8601", value: dateString }
      );
    }

    return dateString;
  },

  /**
   * Envuelve una función asíncrona con manejo de errores
   */
  async tryAsync(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof this.AppError) {
        console.error(`[${error.type}] ${error.message}`, error.details);
        throw error;
      }

      // Intentar detectar tipo de error
      const message = error.message || "Error desconocido";
      let type = this.ERROR_TYPES.UNKNOWN;

      if (message.includes("unique") || message.includes("duplicate")) {
        type = this.ERROR_TYPES.CONSTRAINT;
      } else if (message.includes("not found")) {
        type = this.ERROR_TYPES.NOT_FOUND;
      } else if (message.includes("validation")) {
        type = this.ERROR_TYPES.VALIDATION;
      }

      const appError = new this.AppError(message, type, {
        originalError: error,
        context,
      });
      console.error(`[${type}] ${message}`, appError.details);
      throw appError;
    }
  },

  /**
   * Log de error con contexto
   */
  log(error, context = {}) {
    const errorInfo = {
      message: error.message || String(error),
      type: error.type || this.ERROR_TYPES.UNKNOWN,
      timestamp: new Date().toISOString(),
      context,
      stack: error.stack,
    };

    console.error("[LivestockError]", errorInfo);
    return errorInfo;
  },

  /**
   * Formatea error para mostrar al usuario
   */
  formatForUI(error) {
    if (error instanceof this.AppError) {
      return {
        title: this._getTitleForType(error.type),
        message: error.message,
        icon: this._getIconForType(error.type),
        severity: this._getSeverityForType(error.type),
      };
    }

    return {
      title: "Error",
      message: error.message || "Ocurrió un error inesperado",
      icon: "⚠️",
      severity: "error",
    };
  },

  _getTitleForType(type) {
    const titles = {
      VALIDATION_ERROR: "Datos Inválidos",
      DATABASE_ERROR: "Error de Base de Datos",
      NOT_FOUND: "No Encontrado",
      UNAUTHORIZED: "No Autorizado",
      CONSTRAINT_ERROR: "Restricción de Datos",
      UNKNOWN_ERROR: "Error",
    };
    return titles[type] || "Error";
  },

  _getIconForType(type) {
    const icons = {
      VALIDATION_ERROR: "❌",
      DATABASE_ERROR: "🔴",
      NOT_FOUND: "🔍",
      UNAUTHORIZED: "🔒",
      CONSTRAINT_ERROR: "⛔",
      UNKNOWN_ERROR: "⚠️",
    };
    return icons[type] || "⚠️";
  },

  _getSeverityForType(type) {
    const severities = {
      VALIDATION_ERROR: "warning",
      DATABASE_ERROR: "error",
      NOT_FOUND: "info",
      UNAUTHORIZED: "warning",
      CONSTRAINT_ERROR: "warning",
      UNKNOWN_ERROR: "error",
    };
    return severities[type] || "error";
  },
};

window.ErrorHandler = ErrorHandler;
