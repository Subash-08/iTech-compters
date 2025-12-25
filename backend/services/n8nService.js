// services/n8n.service.js
const axios = require("axios");



class N8NService {
    constructor() {
        this.baseURL = process.env.N8N_BASE_URL;
        this.secret = process.env.N8N_WEBHOOK_SECRET;
        this.timeout = 10000;
        this.workflows = require("../config/n8nWorkflows");
    }

    async run(workflowKey, payload = {}) {
        if (!this.baseURL) {
            console.warn("N8N_BASE_URL not set, skipping n8n call");
            return { skipped: true, reason: "N8N disabled" };
        }

        const workflow = this.workflows[workflowKey];
        if (!workflow) {
            console.error(`Unknown n8n workflowKey: ${workflowKey}`);
            return { success: false, error: "Unknown workflowKey" };
        }

        // Basic safety – don’t accidentally send secrets
        if (payload.password || payload.hashedPassword) {
            console.error(`Unsafe payload for workflow ${workflowKey}: contains password`);
            return { success: false, error: "Unsafe payload blocked" };
        }

        try {
            const { data, status } = await axios.post(
                `${this.baseURL}${workflow.path}`,
                {
                    event: workflowKey,
                    workflowKey,
                    ...payload,
                    timestamp: new Date().toISOString(),
                    source: "backend"
                },
                {
                    timeout: this.timeout,
                    headers: {
                        "Content-Type": "application/json",
                        "X-N8N-SECRET": this.secret,
                        "User-Agent": "Ecommerce-Backend/1.0",
                    },
                }
            );
            console.log(`n8n workflow executed → ${workflowKey} (${status})`);
            return { success: true, status, data };
        } catch (err) {
            console.error("🔥 N8N ERROR DEBUG →");
            console.error("Status Code:", err.response?.status);
            console.error("Status Text:", err.response?.statusText);
            console.error("Response Data:", err.response?.data);
            console.error("Headers Received:", err.response?.headers);
            console.error("Sent Headers:", {
                "X-N8N-SECRET": this.secret,
                "Content-Type": "application/json"
            });
            console.error("Webhook URL:", `${this.baseURL}${workflow.path}`);
            console.error("Payload Sent:", payload);
            console.error("Axios Code:", err.code);
            return { success: false, error: err.message };
        }
    }
}

module.exports = new N8NService();
