function definePlugin(def) {
	return ((opts) => (h3) => def(h3, opts));
}
export { definePlugin as t };
