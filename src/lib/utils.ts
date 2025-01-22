import { exec } from "child_process";\nimport { promisify } from "util";\n\nexport const execAsync = promisify(exec);
