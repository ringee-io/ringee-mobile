const { withAndroidManifest } = require('expo/config-plugins');

const FEATURE = 'android.hardware.sensor.proximity';

function ensureProximityFeature(androidManifest) {
  const manifest = androidManifest.manifest;
  manifest['uses-feature'] = manifest['uses-feature'] || [];
  const exists = manifest['uses-feature'].some(
    (f) => f.$ && f.$['android:name'] === FEATURE,
  );
  if (!exists) {
    manifest['uses-feature'].push({
      $: { 'android:name': FEATURE, 'android:required': 'false' },
    });
  }
  return androidManifest;
}

module.exports = function withProximitySensor(config) {
  return withAndroidManifest(config, (cfg) => {
    cfg.modResults = ensureProximityFeature(cfg.modResults);
    return cfg;
  });
};
