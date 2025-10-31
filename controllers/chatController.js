// controllers/chatController.js
const axios = require("axios"); // ✅ Add this line

const ChatHistory = require("../models/chatHistory");
const Utilisateur = require("../models/Utilisateur");
const Compte = require("../models/Compte");
const Tirelire = require("../models/Tirelire");
const ParentJeune = require("../models/ParentJeune");
const Transaction = require("../models/Transaction");
const Paiement = require("../models/Paiement");
const Magasin = require("../models/Magasin");

const SYSTEM_PROMPT = (
  role,
  context = "",
  roleBlock = ""
) => `Tu es Flexoo, l’assistant virtuel de Flexee Pay.
Réponds toujours dans la langue utilisée par l’utilisateur.
Réponses courtes et claires (1–2 phrases).
Reste utile et propose des conseils financiers adaptés.
Propose des idées d’économies et de gestion de budget selon les catégories de depenses des etudiants (vous pouvez depasser 2 lignes si necessaire).
Ne divulgue jamais d’informations personnelles.
Ne donne jamais de conseils médicaux, juridiques ou autres conseils professionnels.
Si tu ne connais pas la réponse, dis-le simplement.

Rôle utilisateur: ${role}
${roleBlock ? `\nDonnées ${role}:\n${roleBlock}\n` : ""}
Contexte: ${context}`;

async function callHF(prompt) {
  const API_URL = "https://router.huggingface.co/v1/chat/completions";
  const modelId =
    process.env.HF_MODEL_ID || "meta-llama/Llama-3.1-8B-Instruct:fireworks-ai";
  const token = process.env.HF_TOKEN;

  if (!token) throw new Error("HF_TOKEN missing in environment");

  const { data } = await axios.post(
    API_URL,
    {
      model: modelId,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 512,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 120000,
    }
  );

  // 🧹 Clean and return the final text
  let text = data?.choices?.[0]?.message?.content || "";
  text = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\/?think>/gi, "")
    .replace(/^(User|Assistant|System):/gi, "")
    .trim();

  return text || "(empty reply)";
}

// controllers/chatController.js (facts-only; roles are exactly "Jeune" | "Parent")
exports.aiChat = async (req, res) => {
  try {
    const { message, context, role = "inconnu" } = req.body || {};
    const userId = req.user.id;

    if (!message || !String(message).trim()) {
      return res
        .status(400)
        .json({ message: "Message requis", success: false });
    }
    if (!context || !String(context).trim()) {
      return res
        .status(400)
        .json({ message: "Contexte requis", success: false });
    }

    // Inline minis (no external helpers)
    const fmtMoney = (v) => `${Number(v ?? 0).toFixed(2)} DT`;

    const getCompte = (uid) => Compte.findOne({ where: { userId: uid } });
    const getTirelire = (uid) => Tirelire.findOne({ where: { userId: uid } });

    // Paiements: start from Paiement (compte jeune) → join Transaction (montant/date/statut) → optional Magasin
    const getLastPaiements = async (compteId, n = 5) => {
      if (!compteId) return [];
      const pays = await Paiement.findAll({
        where: { id_compteJeune: compteId },
        order: [["createdAt", "DESC"]],
        limit: n,
      });
      if (!pays.length) return [];

      const ids = pays.map((p) => p.id);
      const txs = await Transaction.findAll({ where: { id: ids } });
      const tById = new Map(txs.map((t) => [t.id, t]));

      const magasinIds = [
        ...new Set(pays.map((p) => p.id_magasin).filter(Boolean)),
      ];
      const magasins = magasinIds.length
        ? await Magasin.findAll({ where: { id: magasinIds } })
        : [];
      const mById = new Map(magasins.map((m) => [m.id, m]));

      return pays
        .map((p) => {
          const t = tById.get(p.id);
          return {
            id: p.id,
            montant: t?.montant ?? null,
            date: t?.date_transaction ?? p.createdAt,
            magasin: mById.get(p.id_magasin)?.nomMagasin || null,
            statut: t?.statut ?? null,
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // ── Build the exact facts block the LLM must use (no intent detection) ──
    let roleBlock = "";

    if (role === "Jeune") {
      const [compte, tirelire] = await Promise.all([
        getCompte(userId),
        getTirelire(userId),
      ]);
      const last5 = await getLastPaiements(compte?.id, 5);

      const paiementsLines =
        (last5 || [])
          .map(
            (p) =>
              `- ${new Date(p.date)
                .toISOString()
                .slice(0, 19)
                .replace("T", " ")} • ${fmtMoney(p.montant)}${
                p.magasin ? ` • ${p.magasin}` : ""
              }`
          )
          .join("\n") || "- Aucun paiement.";

      roleBlock = [
        `Mon solde de compte: ${fmtMoney(compte?.solde)}`,
        `Mon solde de tirelire: ${fmtMoney(tirelire?.solde)}`,
        `Mes 5 derniers paiements:`,
        paiementsLines,
      ].join("\n");
    } else if (role === "Parent") {
      // Parent balances
      const [compte, tirelire] = await Promise.all([
        getCompte(userId),
        getTirelire(userId),
      ]);

      // Children list + balances + last 5 paiements
      const links = await ParentJeune.findAll({ where: { id_parent: userId } });
      const childIds = links.map((l) => l.id_jeune);
      const kids = childIds.length
        ? await Utilisateur.findAll({ where: { id: childIds } })
        : [];

      const childLines = [];
      for (const k of kids) {
        const [c, t] = await Promise.all([getCompte(k.id), getTirelire(k.id)]);
        const last5 = await getLastPaiements(c?.id, 5);

        const name =
          [k.prenom, k.nom].filter(Boolean).join(" ").trim() || "(Sans nom)";
        const paiementsLines =
          (last5 || [])
            .map(
              (p) =>
                `  • ${new Date(p.date)
                  .toISOString()
                  .slice(0, 19)
                  .replace("T", " ")} • ${fmtMoney(p.montant)}${
                  p.magasin ? ` • ${p.magasin}` : ""
                }`
            )
            .join("\n") || "  • Aucun paiement.";

        childLines.push(
          `- Enfant: ${name} (id:${k.id}) • Compte: ${fmtMoney(
            c?.solde
          )} • Tirelire: ${fmtMoney(
            t?.solde
          )}\n  Paiements récents:\n${paiementsLines}`
        );
      }

      roleBlock = [
        `Mon solde parent (compte): ${fmtMoney(compte?.solde)}`,
        `Mon solde parent (tirelire): ${fmtMoney(tirelire?.solde)}`,
        `Mes enfants (${childLines.length}):`,
        childLines.length ? childLines.join("\n") : "- Aucun enfant lié.",
      ].join("\n");
    } else {
      roleBlock = "Rôle invalide : utilisez 'Jeune' ou 'Parent'.";
    }

    // History (lightweight)
    let historyText = "";
    try {
      const rows = await ChatHistory.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        limit: 5,
      });
      historyText = rows
        .reverse()
        .map((r) => `User: ${r.userMessage}\nAssistant: ${r.aiResponse}`)
        .join("\n\n");
    } catch (e) {
      console.error("Erreur historique:", e.message);
    }

    // Use your SYSTEM_PROMPT + your front context, with tight guardrails
    const system = SYSTEM_PROMPT(
      role,
      `${context}
- Réponds strictement à partir des données fournies dans "Données ${role}". Si l'information manque, réponds : "Je ne sais pas".
- Si la question est hors sujet, réponds brièvement dans la même langue et rappelle gentiment de rester sur Flexee Pay.`,
      roleBlock
    );

    const completePrompt = `${system}

${
  historyText ? `Conversation précédente :\n${historyText}\n\n` : ""
}Conversation actuelle :
User: ${message}
Assistant:`;

    const aiResponse =
      (await callHF(completePrompt)) ||
      "Je n'ai pas pu générer de réponse. Veuillez réessayer.";

    try {
      await ChatHistory.create({ userId, userMessage: message, aiResponse });
    } catch (e) {
      console.error("Erreur enregistrement:", e.message);
    }

    return res.status(200).json({
      response: aiResponse,
      success: true,
      roleIncluded: Boolean(roleBlock),
      source: "facts-only",
    });
  } catch (error) {
    console.error("Erreur /ai-chat:", error);
    return res.status(500).json({ message: "Erreur serveur", success: false });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ uniquement depuis le JWT

    const exists = await Utilisateur.findByPk(userId);
    if (!exists) {
      return res
        .status(404)
        .json({ message: "Utilisateur introuvable", success: false });
    }

    const history = await ChatHistory.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 15,
    });

    return res.status(200).json({ history, success: true });
  } catch (error) {
    console.error("Erreur /ai-chat/history:", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération de l'historique",
      success: false,
    });
  }
};
