import chalk from "chalk";
export function asciiTable(table) {
    return table.options.head
        .slice(1)
        .map((entryPoint, i) => {
        const keyValuePairs = table.reduce((acc, cur) => {
            var _a, _b;
            const key = (_a = cur[0]) === null || _a === void 0 ? void 0 : _a.toString();
            const value = (_b = cur[i + 1]) === null || _b === void 0 ? void 0 : _b.toString();
            return acc + `${key}: ${value}\n`;
        }, "");
        return `${chalk.bold.blue(entryPoint)}

${keyValuePairs}
***********************************`;
    })
        .join("\n\n");
}
//# sourceMappingURL=asciiTable.js.map