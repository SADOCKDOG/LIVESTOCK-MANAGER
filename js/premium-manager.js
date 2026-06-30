(function () {
  'use strict';

  var isFree = function () {
    return window.FREE_MODE === true;
  };

  var isDemo = function (record) {
    return record && record.demo === true;
  };

  var canModify = function (record) {
    return !isFree() || !isDemo(record);
  };

  var canDelete = function (record) {
    return !isFree() || !isDemo(record);
  };

  var canExport = function () {
    return !isFree();
  };

  var canImportBackup = function () {
    return !isFree();
  };

  var canSeedData = function () {
    return !isFree();
  };

  var maxAnimals = function () {
    return isFree() ? 15 : Infinity;
  };

  var maxGastos = function () {
    return isFree() ? 30 : Infinity;
  };

  var PremiumManager = {
    isFree: isFree,
    isDemo: isDemo,
    canModify: canModify,
    canDelete: canDelete,
    canExport: canExport,
    canImportBackup: canImportBackup,
    canSeedData: canSeedData,
    maxAnimals: maxAnimals,
    maxGastos: maxGastos
  };

  window.PremiumManager = PremiumManager;
})();
