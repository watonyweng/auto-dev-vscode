import { EXT_LANGUAGE_MAP, type SupportedLanguage } from "./supported";
import Parser, { Language } from "web-tree-sitter";
import fs from "fs";
import path from "path";

const LanguageMap: Map<SupportedLanguage, Parser.Language> = new Map();
async function loadLanguageOndemand(langid: SupportedLanguage) {
  switch (langid) {
    case "c":
      if (!LanguageMap.has("c")) {
        LanguageMap.set("c", await Parser.Language.load(wasmByLanguage("c")));
      }
      break;
    case "cpp":
      if (!LanguageMap.has("cpp")) {
        LanguageMap.set("cpp", await Parser.Language.load(wasmByLanguage("cpp")));
      }
      break;
    case "csharp":
      if (!LanguageMap.has("csharp")) {
        LanguageMap.set("csharp", await Parser.Language.load(wasmByLanguage("c_sharp")));
      }
      break;
    case "go":
      if (!LanguageMap.has("go")) {
        LanguageMap.set("go", await Parser.Language.load("go"));
      }
      break;
    case "java":
      if (!LanguageMap.has("java")) {
        LanguageMap.set("java", await Parser.Language.load(wasmByLanguage("java")));
      }
      break;
    case "javascript":
      if (!LanguageMap.has("javascript")) {
        LanguageMap.set("javascript", await Parser.Language.load(wasmByLanguage("javascript")));
      }
      break;
    case "typescript":
      if (!LanguageMap.has("typescript")) {
        LanguageMap.set("typescript", await Parser.Language.load(wasmByLanguage("typescript")));
      }
      break;
    case "python":
      if (!LanguageMap.has("python")) {
        LanguageMap.set("python", await Parser.Language.load(wasmByLanguage("python")));
      }
      break;
    case "rust":
      if (!LanguageMap.has("rust")) {
        LanguageMap.set("rust", await Parser.Language.load(wasmByLanguage("rust")));
      }
      break;
    default:
      throw new Error("Unsupported language");
  }
}

const ParserMap: Record<
  SupportedLanguage,
  (source: string) => Promise<Parser.Tree>
> = {
  c: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("c"));
    return parser.parse(source);
  },
  cpp: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("cpp"));
    return parser.parse(source);
  },
  csharp: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("csharp"));
    return parser.parse(source);
  },
  go: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("go"));
    return parser.parse(source);
  },
  java: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("java"));
    return parser.parse(source);
  },
  javascript: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("javascript"));
    return parser.parse(source);
  },
  typescript: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("typescript"));
    return parser.parse(source);
  },
  python: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("python"));
    return parser.parse(source);
  },
  rust: async (source: string) => {
    const parser = new Parser();
    parser.setLanguage(LanguageMap.get("rust"));
    return parser.parse(source);
  },
};

let inited = false;
export async function parse(langid: SupportedLanguage, source: string): Promise<Parser.Tree> {
  if (!inited) {
    await Parser.init();
    inited = true;
  }

  if (!ParserMap[langid]) {
    throw new Error(`Unsupported language: ${langid}`);
  }

  await loadLanguageOndemand(langid);
  return ParserMap[langid](source);
}

export async function getLanguageForFile(
  filepath: string
): Promise<Language | undefined> {
  try {
    await Parser.init();
    const extension = path.extname(filepath).slice(1);

    let langid = EXT_LANGUAGE_MAP[extension];
    if (!langid) {
      return undefined;
    }

    return await getLanguage(langid);
  } catch (e) {
    console.error("Unable to load language for file", filepath, e);
    return undefined;
  }
}

function wasmByLanguage(langId: string) {
  const wasmPath = path.join(
    __dirname,
    "tree-sitter-wasms",
    `tree-sitter-${langId}.wasm`
  );

  return wasmPath;
}

export async function getLanguage(
  langId: string
): Promise<Language | undefined> {
  try {
    await Parser.init();

    await loadLanguageOndemand(langId);
    return LanguageMap.get(langId);
  } catch (e) {
    console.error("Unable to load language for lang", langId, e);
    return undefined;
  }
}

export async function getParserForFile(filepath: string) {
  if (process.env.IS_BINARY) {
    return undefined;
  }

  try {
    await Parser.init();
    const parser = new Parser();

    const language = await getLanguageForFile(filepath);
    parser.setLanguage(language);

    return parser;
  } catch (e) {
    console.error("Unable to load language for file", filepath, e);
    return undefined;
  }
}

export function getQuerySource(filepath: string) {
  const fullLangName = EXT_LANGUAGE_MAP[filepath.split(".").pop() ?? ""];
  const sourcePath = path.join(__dirname, "semantic", `${fullLangName}.scm`);
  if (!fs.existsSync(sourcePath)) {
    throw new Error("cannot find file:" + sourcePath);
  }

  return fs.readFileSync(sourcePath).toString();
}

export async function getSnippetsInFile(
  filepath: string,
  contents: string
): Promise<(any & { title: string })[]> {
  const lang = await getLanguageForFile(filepath);
  if (!lang) {
    return [];
  }
  const parser = await getParserForFile(filepath);
  if (!parser) {
    return [];
  }
  const ast = parser.parse(contents);
  const query = lang?.query(getQuerySource(filepath));
  const matches = query?.matches(ast.rootNode);

  return (
    matches?.flatMap((match) => {
      const node = match.captures[0].node;
      const title = match.captures[1].node.text;
      const results = {
        title,
        content: node.text,
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
      };
      return results;
    }) ?? []
  );
}

export async function getAst(
  filepath: string,
  fileContents: string
): Promise<Parser.Tree | undefined> {
  const parser = await getParserForFile(filepath);

  if (!parser) {
    return undefined;
  }

  try {
    const ast = parser.parse(fileContents);
    return ast;
  } catch (e) {
    return undefined;
  }
}

export async function getTreePathAtCursor(
  ast: Parser.Tree,
  cursorIndex: number
): Promise<Parser.SyntaxNode[] | undefined> {
  const path = [ast.rootNode];
  while (path[path.length - 1].childCount > 0) {
    let foundChild = false;
    for (let child of path[path.length - 1].children) {
      if (child.startIndex <= cursorIndex && child.endIndex >= cursorIndex) {
        path.push(child);
        foundChild = true;
        break;
      }
    }

    if (!foundChild) {
      break;
    }
  }

  return path;
}
