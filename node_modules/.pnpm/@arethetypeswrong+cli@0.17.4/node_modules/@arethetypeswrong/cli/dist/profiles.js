export const profiles = {
    strict: {
        ignoreResolutions: [],
    },
    node16: {
        ignoreResolutions: ["node10"],
    },
    "esm-only": {
        ignoreResolutions: ["node10", "node16-cjs"],
    },
};
/**
 * Merges the profile with the provided options
 *
 * @param profileKey - name of the profile to apply
 * @param opts - options to apply the profile to
 */
export function applyProfile(profileKey, opts) {
    var _a;
    const profile = profiles[profileKey];
    opts.ignoreResolutions = ((_a = opts.ignoreResolutions) !== null && _a !== void 0 ? _a : []).concat(profile.ignoreResolutions);
}
//# sourceMappingURL=profiles.js.map