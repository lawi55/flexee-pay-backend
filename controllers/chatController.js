const ChatHistory = require("../models/chatHistory");
const Utilisateur = require("../models/Utilisateur");

// If you keep an auth middleware that attaches req.user, we’ll use it when userId isn’t provided in the body.

const SYSTEM_PROMPT = (context = "") => `You are a helpful assistant for ImpacTunisia.
Keep responses concise (1-2 sentences maximum).
Maintain context from the previous conversation.

Key Information about ImpacTunisia:
- Focus: Environmental conservation and sustainability
- Programs: Tree planting, beach cleanups, workshops, recycling initiatives
- Values: Community engagement, environmental protection, education
- Pricing: Various donation options available ($10/$25/$100)

Additional context: ${context}`;

async function callOllama(prompt, fetchImpl = fetch) {
    const url = process.env.OLLAMA_URL || "http://localhost:11434";
    const model = process.env.MODEL_NAME || "llama3.1";
    const res = await fetchImpl(`${url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Ollama error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    return data?.response || "";
}

/**
 * POST /ai-chat
 * body: { message: string, userId?: UUID, context: string }
 */
exports.aiChat = async (req, res) => {
    try {
        const { message, userId: bodyUserId, context } = req.body || {};
        const authUserId = req.user?.id; // comes from your JWT middleware
        const userId = bodyUserId || authUserId || null;

        // --- Validation (mirror your style) ---
        if (!message || !String(message).trim()) {
            return res.status(400).json({ message: "Message requis", success: false });
        }
        if (!context || !String(context).trim()) {
            // because your ChatHistory model has allowNull: false for context
            return res.status(400).json({ message: "Contexte requis", success: false });
        }

        // --- Optional: validate that userId exists in Utilisateur when present ---
        if (userId) {
            const exists = await Utilisateur.findByPk(userId);
            if (!exists) {
                return res.status(404).json({ message: "Utilisateur introuvable", success: false });
            }
        }

        // --- Build conversation history text (last 10, ASC to preserve flow) ---
        let historyText = "";
        if (userId) {
            try {
                const rows = await ChatHistory.findAll({
                    where: { userId },
                    order: [["createdAt", "ASC"]],
                    limit: 10,
                });
                historyText = rows
                    .map((r) => `User: ${r.userMessage}\nAssistant: ${r.aiResponse}`)
                    .join("\n\n");
            } catch (e) {
                console.error("Erreur récupération historique:", e.message);
                // continue without history
            }
        }

        const system = SYSTEM_PROMPT(context);
        const completePrompt = `${system}

${historyText ? `Previous conversation:\n${historyText}\n\n` : ""}Current conversation:
User: ${message}
Assistant:`;

        // --- Call LLM ---
        const aiResponse =
            (await callOllama(completePrompt)) ||
            "Je n'ai pas pu générer de réponse. Veuillez réessayer.";

        // --- Save turn to history (context is required by your model) ---
        try {
            await ChatHistory.create({
                userId,                   // can be null (allowNull: true)
                userMessage: message,
                aiResponse,
                context,                  // required (allowNull: false)
            });
        } catch (e) {
            console.error("Erreur enregistrement historique:", e.message);
            // do not block response
        }

        return res.status(200).json({
            response: aiResponse,
            success: true,
            historyIncluded: Boolean(historyText),
        });
    } catch (error) {
        console.error("Erreur /ai-chat:", error);
        return res.status(500).json({ message: "Erreur serveur", success: false });
    }
};

/**
 * GET /ai-chat/history?userId=UUID
 */
exports.getHistory = async (req, res) => {
    try {
        const { userId: queryUserId } = req.query;
        const authUserId = req.user?.id;
        const userId = queryUserId || authUserId;

        if (!userId) {
            return res.status(400).json({ message: "User ID requis", success: false });
        }

        // (Optional) verify user exists
        const exists = await Utilisateur.findByPk(userId);
        if (!exists) {
            return res.status(404).json({ message: "Utilisateur introuvable", success: false });
        }

        const history = await ChatHistory.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
            limit: 20,
        });

        return res.status(200).json({ history, success: true });
    } catch (error) {
        console.error("Erreur /ai-chat/history:", error);
        return res
            .status(500)
            .json({ message: "Erreur lors de la récupération de l'historique", success: false });
    }
};
