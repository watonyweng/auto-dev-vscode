import { TestGenProvider } from "./_base/test/TestGenProvider";
import { SupportedLanguage } from "../editor/language/SupportedLanguage";
import { DefaultLanguageService } from "../editor/language/service/DefaultLanguageService";
import { JavaTestGenProvider } from "./java/JavaTestGenProvider";

export class TestGenProviderManager {
	private testGenMap: Map<SupportedLanguage, TestGenProvider> = new Map();

	async init() {
		let map: Map<string, TestGenProvider> = new Map();
		const testGen = new JavaTestGenProvider();
		await testGen.setup(new DefaultLanguageService());
		map.set("java", testGen);
		this.testGenMap = map;
	}

	getTestGenProvider(lang: SupportedLanguage): TestGenProvider | undefined {
		return this.testGenMap.get(lang);
	}
}