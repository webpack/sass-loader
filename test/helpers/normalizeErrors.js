/**
 * @param {string} str string
 * @returns {string} string without cwd
 */
function removeCWD(str) {
  const isWin = process.platform === "win32";
  let cwd = process.cwd();

  if (isWin) {
    str = str.replaceAll("\\", "/");

    cwd = cwd.replaceAll("\\", "/");
  }

  return str
    .replaceAll(new RegExp(cwd, "g"), "")
    .replaceAll("file:////", "file:///");
}

export default (errors, needVerbose) =>
  errors
    .filter(
      (error) => !error.message.includes("Sass @import rules are deprecated"),
    )
    .map((error) =>
      removeCWD(
        needVerbose
          ? error.toString()
          : error.toString().split("\n").slice(0, 2).join("\n"),
      ),
    );
