export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    nvidia: {
        apiKey: process.env.NVIDIA_API_KEY,
        baseUrl: process.env.NVIDIA_URL || 'https://integrate.api.nvidia.com/v1',
    },
    maxContextTokens: parseInt(process.env.MAX_CONTEXT_TOKENS, 10) || 100000,
    charsPerToken: parseInt(process.env.CHARS_PER_TOKEN, 10) || 2,
    logFile: process.env.LOG_FILE || 'proxy.log',
});
