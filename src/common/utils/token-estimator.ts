export class TokenEstimator {
    private static readonly CHARS_PER_TOKEN = 2; // Conservative estimate

    static estimateTokens(content: any): number {
        if (!content) return 0;

        if (typeof content === 'string') {
            return Math.ceil(content.length / this.CHARS_PER_TOKEN);
        }

        if (Array.isArray(content)) {
            let total = 0;
            for (const item of content) {
                if (typeof item === 'string') {
                    total += this.estimateTokens(item);
                } else if (item.type === 'image_url') {
                    // Fixed cost for images in most models roughly ~800-1100 tokens
                    total += 1000;
                } else if (item.text) {
                    total += this.estimateTokens(item.text);
                }
            }
            return total;
        }

        return 0;
    }

    static estimateMessageTokens(message: any): number {
        let tokens = 4; // role + overhead
        tokens += this.estimateTokens(message.content);
        if (message.tool_calls) {
            tokens += JSON.stringify(message.tool_calls).length / this.CHARS_PER_TOKEN;
        }
        return Math.ceil(tokens);
    }
}
