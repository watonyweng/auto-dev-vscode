import { LocalInference } from "../../code-search/embedding/LocalInference";

describe('LocalInference', () => {
	it.skip('should encoding', async () => {
		let localInference = new LocalInference();
		let promise = await localInference.embed("test");
		console.log(promise);
	});
});