import path from "node:path";
import { snapshot } from "node:test";

// Store snapshots in `test/__snapshots__/<file>.snap` to match the previous
// (jest) layout instead of putting them next to each test file.
snapshot.setResolveSnapshotPath((testFilePath) => {
  const dir = path.dirname(testFilePath);
  const file = path.basename(testFilePath);

  return path.join(dir, "__snapshots__", `${file}.snap`);
});
